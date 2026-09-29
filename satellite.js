var satellite=(function(){var M={},C={};function define(n,d,f){M[n]={d:d,f:f}}function req(n){if(C[n])return C[n];var e={};C[n]=e;var m=M[n];m.f.apply(null,m.d.map(function(x){return x==="require"?req:x==="exports"?e:req(x)}));return e}
define("ext", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.days2mdhms = days2mdhms;
    exports.jday = jday;
    exports.invjday = invjday;
    /* -----------------------------------------------------------------------------
     *
     *                           procedure days2mdhms
     *
     *  this procedure converts the day of the year, days, to the equivalent month
     *    day, hour, minute and second.
     *
     *  algorithm     : set up array for the number of days per month
     *                  find leap year - use 1900 because 2000 is a leap year
     *                  loop through a temp value while the value is < the days
     *                  perform int conversions to the correct day and month
     *                  convert remainder into h m s using type conversions
     *
     *  author        : david vallado                  719-573-2600    1 mar 2001
     *
     *  inputs          description                    range / units
     *    year        - year                           1900 .. 2100
     *    days        - julian day of the year         0.0  .. 366.0
     *
     *  outputs       :
     *    mon         - month                          1 .. 12
     *    day         - day                            1 .. 28,29,30,31
     *    hr          - hour                           0 .. 23
     *    min         - minute                         0 .. 59
     *    sec         - second                         0.0 .. 59.999
     *
     *  locals        :
     *    dayofyr     - day of year
     *    temp        - temporary extended values
     *    inttemp     - temporary int value
     *    i           - index
     *    lmonth[12]  - int array containing the number of days per month
     *
     *  coupling      :
     *    none.
     * --------------------------------------------------------------------------- */
    function days2mdhms(year, days) {
        const lmonth = [
            31,
            year % 4 === 0 ? 29 : 28,
            31,
            30,
            31,
            30,
            31,
            31,
            30,
            31,
            30,
            31,
        ];
        const dayofyr = Math.floor(days);
        //  ----------------- find month and day of month ----------------
        let i = 1;
        let inttemp = 0;
        // i starts from 1 so no null check is needed
        // biome-ignore-start lint/style/noNonNullAssertion: index arithmetic
        while (dayofyr > inttemp + lmonth[i - 1] && i < 12) {
            inttemp += lmonth[i - 1];
            // biome-ignore-end lint/style/noNonNullAssertion: index arithmetic
            i += 1;
        }
        const mon = i;
        const day = dayofyr - inttemp;
        //  ----------------- find hours minutes and seconds -------------
        let temp = (days - dayofyr) * 24.0;
        const hr = Math.floor(temp);
        temp = (temp - hr) * 60.0;
        const minute = Math.floor(temp);
        const sec = (temp - minute) * 60.0;
        return {
            mon,
            day,
            hr,
            minute,
            sec,
        };
    }
    /* -----------------------------------------------------------------------------
     *
     *                           procedure jday
     *
     *  this procedure finds the julian date given the year, month, day, and time.
     *    the julian date is defined by each elapsed day since noon, jan 1, 4713 bc.
     *
     *  algorithm     : calculate the answer in one step for efficiency
     *
     *  author        : david vallado                  719-573-2600    1 mar 2001
     *
     *  inputs          description                    range / units
     *    year        - year                           1900 .. 2100
     *    mon         - month                          1 .. 12
     *    day         - day                            1 .. 28,29,30,31
     *    hr          - universal time hour            0 .. 23
     *    min         - universal time min             0 .. 59
     *    sec         - universal time sec             0.0 .. 59.999
     *
     *  outputs       :
     *    jd          - julian date                    days from 4713 bc
     *
     *  locals        :
     *    none.
     *
     *  coupling      :
     *    none.
     *
     *  references    :
     *    vallado       2007, 189, alg 14, ex 3-14
     *
     * --------------------------------------------------------------------------- */
    function jdayInternal(year, mon, day, hr, minute, sec, msec = 0) {
        return (367.0 * year -
            Math.floor(7 * (year + Math.floor((mon + 9) / 12.0)) * 0.25) +
            Math.floor((275 * mon) / 9.0) +
            day +
            1721013.5 +
            ((msec / 60000 + sec / 60.0 + minute) / 60.0 + hr) / 24.0 // ut in days
        // # - 0.5*sgn(100.0*year + mon - 190002.5) + 0.5;
        );
    }
    function jday(yearOrDate, mon, day, hr, minute, sec, msec = 0) {
        if (yearOrDate instanceof Date) {
            const date = yearOrDate;
            return jdayInternal(date.getUTCFullYear(), date.getUTCMonth() + 1, // Note, this function requires months in range 1-12.
            date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
        }
        // biome-ignore lint/style/noNonNullAssertion: overloads make them non-nullable
        return jdayInternal(yearOrDate, mon, day, hr, minute, sec, msec);
    }
    function invjday(jd, asArray) {
        // --------------- find year and days of the year -
        const temp = jd - 2415019.5;
        const tu = temp / 365.25;
        let year = 1900 + Math.floor(tu);
        let leapyrs = Math.floor((year - 1901) * 0.25);
        // optional nudge by 8.64x10-7 sec to get even outputs
        let days = temp - ((year - 1900) * 365.0 + leapyrs) + 0.00000000001;
        // ------------ check for case of beginning of a year -----------
        if (days < 1.0) {
            year -= 1;
            leapyrs = Math.floor((year - 1901) * 0.25);
            days = temp - ((year - 1900) * 365.0 + leapyrs);
        }
        // ----------------- find remaing data  -------------------------
        const mdhms = days2mdhms(year, days);
        const { mon, day, hr, minute } = mdhms;
        const sec = mdhms.sec - 0.000000864;
        if (asArray) {
            return [year, mon, day, hr, minute, Math.floor(sec)];
        }
        return new Date(Date.UTC(year, mon - 1, day, hr, minute, Math.floor(sec)));
    }
});
define("common-types", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("constants", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.xpdotp = exports.x2o3 = exports.j3oj2 = exports.j4 = exports.j3 = exports.j2 = exports.tumin = exports.vkmpersec = exports.xke = exports.earthRadius = exports.mu = exports.minutesPerDay = exports.rad2deg = exports.deg2rad = exports.twoPi = exports.pi = void 0;
    exports.pi = Math.PI;
    exports.twoPi = exports.pi * 2;
    exports.deg2rad = exports.pi / 180.0;
    exports.rad2deg = 180 / exports.pi;
    exports.minutesPerDay = 1440.0;
    exports.mu = 398600.8; // in km3 / s2
    exports.earthRadius = 6378.135; // in km
    exports.xke = 60.0 / Math.sqrt((exports.earthRadius * exports.earthRadius * exports.earthRadius) / exports.mu);
    exports.vkmpersec = (exports.earthRadius * exports.xke) / 60.0;
    exports.tumin = 1.0 / exports.xke;
    exports.j2 = 0.001082616;
    exports.j3 = -0.00000253881;
    exports.j4 = -0.00000165597;
    exports.j3oj2 = exports.j3 / exports.j2;
    exports.x2o3 = 2.0 / 3.0;
    exports.xpdotp = 1440.0 / (2.0 * exports.pi); // 229.1831180523293;
});
define("propagation/SatRec", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SatRecError = void 0;
    var SatRecError;
    (function (SatRecError) {
        /**
         * No error, propagation for the last supplied date is successful
         */
        SatRecError[SatRecError["None"] = 0] = "None";
        /**
         * Mean eccentricity is out of range 0 ≤ e < 1
         */
        SatRecError[SatRecError["MeanEccentricityOutOfRange"] = 1] = "MeanEccentricityOutOfRange";
        /**
         * Mean motion has fallen below zero.
         */
        SatRecError[SatRecError["MeanMotionBelowZero"] = 2] = "MeanMotionBelowZero";
        /**
         * Perturbed eccentricity is out of range 0 ≤ e < 1
         */
        SatRecError[SatRecError["PerturbedEccentricityOutOfRange"] = 3] = "PerturbedEccentricityOutOfRange";
        /**
         * Length of the orbit’s semi-latus rectum has fallen below zero.
         */
        SatRecError[SatRecError["SemiLatusRectumBelowZero"] = 4] = "SemiLatusRectumBelowZero";
        // 5 is not used
        /**
         * Orbit has decayed: the computed position is underground.
         */
        SatRecError[SatRecError["Decayed"] = 6] = "Decayed";
    })(SatRecError || (exports.SatRecError = SatRecError = {}));
});
define("propagation/dpper", ["require", "exports", "constants"], function (require, exports, constants_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.dpper = dpper;
    /* -----------------------------------------------------------------------------
     *
     *                           procedure dpper
     *
     *  this procedure provides deep space long period periodic contributions
     *    to the mean elements.  by design, these periodics are zero at epoch.
     *    this used to be dscom which included initialization, but it's really a
     *    recurring function.
     *
     *  author        : david vallado                  719-573-2600   28 jun 2005
     *
     *  inputs        :
     *    e3          -
     *    ee2         -
     *    peo         -
     *    pgho        -
     *    pho         -
     *    pinco       -
     *    plo         -
     *    se2 , se3 , sgh2, sgh3, sgh4, sh2, sh3, si2, si3, sl2, sl3, sl4 -
     *    t           -
     *    xh2, xh3, xi2, xi3, xl2, xl3, xl4 -
     *    zmol        -
     *    zmos        -
     *    ep          - eccentricity                           0.0 - 1.0
     *    inclo       - inclination - needed for lyddane modification
     *    nodep       - right ascension of ascending node
     *    argpp       - argument of perigee
     *    mp          - mean anomaly
     *
     *  outputs       :
     *    ep          - eccentricity                           0.0 - 1.0
     *    inclp       - inclination
     *    nodep        - right ascension of ascending node
     *    argpp       - argument of perigee
     *    mp          - mean anomaly
     *
     *  locals        :
     *    alfdp       -
     *    betdp       -
     *    cosip  , sinip  , cosop  , sinop  ,
     *    dalf        -
     *    dbet        -
     *    dls         -
     *    f2, f3      -
     *    pe          -
     *    pgh         -
     *    ph          -
     *    pinc        -
     *    pl          -
     *    sel   , ses   , sghl  , sghs  , shl   , shs   , sil   , sinzf , sis   ,
     *    sll   , sls
     *    xls         -
     *    xnoh        -
     *    zf          -
     *    zm          -
     *
     *  coupling      :
     *    none.
     *
     *  references    :
     *    hoots, roehrich, norad spacetrack report #3 1980
     *    hoots, norad spacetrack report #6 1986
     *    hoots, schumacher and glover 2004
     *    vallado, crawford, hujsak, kelso  2006
     ----------------------------------------------------------------------------*/
    function dpper(satrec, options) {
        const { e3, ee2, peo, pgho, pho, pinco, plo, se2, se3, sgh2, sgh3, sgh4, sh2, sh3, si2, si3, sl2, sl3, sl4, t, xgh2, xgh3, xgh4, xh2, xh3, xi2, xi3, xl2, xl3, xl4, zmol, zmos, } = satrec;
        const { init, opsmode } = options;
        let { ep, inclp, nodep, argpp, mp } = options;
        // Copy satellite attributes into local variables for convenience
        // and symmetry in writing formulae.
        let alfdp;
        let betdp;
        let cosip;
        let sinip;
        let cosop;
        let sinop;
        let dalf;
        let dbet;
        let dls;
        let f2;
        let f3;
        let pe;
        let pgh;
        let ph;
        let pinc;
        let pl;
        let sinzf;
        let xls;
        let xnoh;
        let zf;
        let zm;
        //  ---------------------- constants -----------------------------
        const zns = 1.19459e-5;
        const zes = 0.01675;
        const znl = 1.5835218e-4;
        const zel = 0.0549;
        //  --------------- calculate time varying periodics -----------
        zm = zmos + zns * t;
        // be sure that the initial call has time set to zero
        if (init === 'y') {
            zm = zmos;
        }
        zf = zm + 2.0 * zes * Math.sin(zm);
        sinzf = Math.sin(zf);
        f2 = 0.5 * sinzf * sinzf - 0.25;
        f3 = -0.5 * sinzf * Math.cos(zf);
        const ses = se2 * f2 + se3 * f3;
        const sis = si2 * f2 + si3 * f3;
        const sls = sl2 * f2 + sl3 * f3 + sl4 * sinzf;
        const sghs = sgh2 * f2 + sgh3 * f3 + sgh4 * sinzf;
        const shs = sh2 * f2 + sh3 * f3;
        zm = zmol + znl * t;
        if (init === 'y') {
            zm = zmol;
        }
        zf = zm + 2.0 * zel * Math.sin(zm);
        sinzf = Math.sin(zf);
        f2 = 0.5 * sinzf * sinzf - 0.25;
        f3 = -0.5 * sinzf * Math.cos(zf);
        const sel = ee2 * f2 + e3 * f3;
        const sil = xi2 * f2 + xi3 * f3;
        const sll = xl2 * f2 + xl3 * f3 + xl4 * sinzf;
        const sghl = xgh2 * f2 + xgh3 * f3 + xgh4 * sinzf;
        const shll = xh2 * f2 + xh3 * f3;
        pe = ses + sel;
        pinc = sis + sil;
        pl = sls + sll;
        pgh = sghs + sghl;
        ph = shs + shll;
        if (init === 'n') {
            pe -= peo;
            pinc -= pinco;
            pl -= plo;
            pgh -= pgho;
            ph -= pho;
            inclp += pinc;
            ep += pe;
            sinip = Math.sin(inclp);
            cosip = Math.cos(inclp);
            /* ----------------- apply periodics directly ------------ */
            // sgp4fix for lyddane choice
            // strn3 used original inclination - this is technically feasible
            // gsfc used perturbed inclination - also technically feasible
            // probably best to readjust the 0.2 limit value and limit discontinuity
            // 0.2 rad = 11.45916 deg
            // use next line for original strn3 approach and original inclination
            // if (inclo >= 0.2)
            // use next line for gsfc version and perturbed inclination
            if (inclp >= 0.2) {
                ph /= sinip;
                pgh -= cosip * ph;
                argpp += pgh;
                nodep += ph;
                mp += pl;
            }
            else {
                //  ---- apply periodics with lyddane modification ----
                sinop = Math.sin(nodep);
                cosop = Math.cos(nodep);
                alfdp = sinip * sinop;
                betdp = sinip * cosop;
                dalf = ph * cosop + pinc * cosip * sinop;
                dbet = -ph * sinop + pinc * cosip * cosop;
                alfdp += dalf;
                betdp += dbet;
                nodep %= constants_js_1.twoPi;
                //  sgp4fix for afspc written intrinsic functions
                //  nodep used without a trigonometric function ahead
                if (nodep < 0.0 && opsmode === 'a') {
                    nodep += constants_js_1.twoPi;
                }
                xls = mp + argpp + cosip * nodep;
                dls = pl + pgh - pinc * nodep * sinip;
                xls += dls;
                xnoh = nodep;
                nodep = Math.atan2(alfdp, betdp);
                //  sgp4fix for afspc written intrinsic functions
                //  nodep used without a trigonometric function ahead
                if (nodep < 0.0 && opsmode === 'a') {
                    nodep += constants_js_1.twoPi;
                }
                if (Math.abs(xnoh - nodep) > constants_js_1.pi) {
                    if (nodep < xnoh) {
                        nodep += constants_js_1.twoPi;
                    }
                    else {
                        nodep -= constants_js_1.twoPi;
                    }
                }
                mp += pl;
                argpp = xls - mp - cosip * nodep;
            }
        }
        return {
            ep,
            inclp,
            nodep,
            argpp,
            mp,
        };
    }
});
define("propagation/dscom", ["require", "exports", "constants"], function (require, exports, constants_js_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.dscom = dscom;
    /*-----------------------------------------------------------------------------
     *
     *                           procedure dscom
     *
     *  this procedure provides deep space common items used by both the secular
     *    and periodics subroutines.  input is provided as shown. this routine
     *    used to be called dpper, but the functions inside weren't well organized.
     *
     *  author        : david vallado                  719-573-2600   28 jun 2005
     *
     *  inputs        :
     *    epoch       -
     *    ep          - eccentricity
     *    argpp       - argument of perigee
     *    tc          -
     *    inclp       - inclination
     *    nodep       - right ascension of ascending node
     *    np          - mean motion
     *
     *  outputs       :
     *    sinim  , cosim  , sinomm , cosomm , snodm  , cnodm
     *    day         -
     *    e3          -
     *    ee2         -
     *    em          - eccentricity
     *    emsq        - eccentricity squared
     *    gam         -
     *    peo         -
     *    pgho        -
     *    pho         -
     *    pinco       -
     *    plo         -
     *    rtemsq      -
     *    se2, se3         -
     *    sgh2, sgh3, sgh4        -
     *    sh2, sh3, si2, si3, sl2, sl3, sl4         -
     *    s1, s2, s3, s4, s5, s6, s7          -
     *    ss1, ss2, ss3, ss4, ss5, ss6, ss7, sz1, sz2, sz3         -
     *    sz11, sz12, sz13, sz21, sz22, sz23, sz31, sz32, sz33        -
     *    xgh2, xgh3, xgh4, xh2, xh3, xi2, xi3, xl2, xl3, xl4         -
     *    nm          - mean motion
     *    z1, z2, z3, z11, z12, z13, z21, z22, z23, z31, z32, z33         -
     *    zmol        -
     *    zmos        -
     *
     *  locals        :
     *    a1, a2, a3, a4, a5, a6, a7, a8, a9, a10         -
     *    betasq      -
     *    cc          -
     *    ctem, stem        -
     *    x1, x2, x3, x4, x5, x6, x7, x8          -
     *    xnodce      -
     *    xnoi        -
     *    zcosg  , zsing  , zcosgl , zsingl , zcosh  , zsinh  , zcoshl , zsinhl ,
     *    zcosi  , zsini  , zcosil , zsinil ,
     *    zx          -
     *    zy          -
     *
     *  coupling      :
     *    none.
     *
     *  references    :
     *    hoots, roehrich, norad spacetrack report #3 1980
     *    hoots, norad spacetrack report #6 1986
     *    hoots, schumacher and glover 2004
     *    vallado, crawford, hujsak, kelso  2006
     ----------------------------------------------------------------------------*/
    function dscom(options) {
        const { epoch, ep, argpp, tc, inclp, nodep, np } = options;
        let a1;
        let a2;
        let a3;
        let a4;
        let a5;
        let a6;
        let a7;
        let a8;
        let a9;
        let a10;
        let cc;
        let x1;
        let x2;
        let x3;
        let x4;
        let x5;
        let x6;
        let x7;
        let x8;
        let zcosg;
        let zsing;
        let zcosh;
        let zsinh;
        let zcosi;
        let zsini;
        let ss1;
        let ss2;
        let ss3;
        let ss4;
        let ss5;
        let ss6;
        let ss7;
        let sz1;
        let sz2;
        let sz3;
        let sz11;
        let sz12;
        let sz13;
        let sz21;
        let sz22;
        let sz23;
        let sz31;
        let sz32;
        let sz33;
        let s1;
        let s2;
        let s3;
        let s4;
        let s5;
        let s6;
        let s7;
        let z1;
        let z2;
        let z3;
        let z11;
        let z12;
        let z13;
        let z21;
        let z22;
        let z23;
        let z31;
        let z32;
        let z33;
        // -------------------------- constants -------------------------
        const zes = 0.01675;
        const zel = 0.0549;
        const c1ss = 2.9864797e-6;
        const c1l = 4.7968065e-7;
        const zsinis = 0.39785416;
        const zcosis = 0.91744867;
        const zcosgs = 0.1945905;
        const zsings = -0.98088458;
        //  --------------------- local variables ------------------------
        const nm = np;
        const em = ep;
        const snodm = Math.sin(nodep);
        const cnodm = Math.cos(nodep);
        const sinomm = Math.sin(argpp);
        const cosomm = Math.cos(argpp);
        const sinim = Math.sin(inclp);
        const cosim = Math.cos(inclp);
        const emsq = em * em;
        const betasq = 1.0 - emsq;
        const rtemsq = Math.sqrt(betasq);
        //  ----------------- initialize lunar solar terms ---------------
        const peo = 0.0;
        const pinco = 0.0;
        const plo = 0.0;
        const pgho = 0.0;
        const pho = 0.0;
        const day = epoch + 18261.5 + tc / 1440.0;
        const xnodce = (4.523602 - 9.2422029e-4 * day) % constants_js_2.twoPi;
        const stem = Math.sin(xnodce);
        const ctem = Math.cos(xnodce);
        const zcosil = 0.91375164 - 0.03568096 * ctem;
        const zsinil = Math.sqrt(1.0 - zcosil * zcosil);
        const zsinhl = (0.089683511 * stem) / zsinil;
        const zcoshl = Math.sqrt(1.0 - zsinhl * zsinhl);
        const gam = 5.8351514 + 0.001944368 * day;
        let zx = (0.39785416 * stem) / zsinil;
        const zy = zcoshl * ctem + 0.91744867 * zsinhl * stem;
        zx = Math.atan2(zx, zy);
        zx += gam - xnodce;
        const zcosgl = Math.cos(zx);
        const zsingl = Math.sin(zx);
        //  ------------------------- do solar terms ---------------------
        zcosg = zcosgs;
        zsing = zsings;
        zcosi = zcosis;
        zsini = zsinis;
        zcosh = cnodm;
        zsinh = snodm;
        cc = c1ss;
        const xnoi = 1.0 / nm;
        let lsflg = 0;
        while (lsflg < 2) {
            lsflg += 1;
            a1 = zcosg * zcosh + zsing * zcosi * zsinh;
            a3 = -zsing * zcosh + zcosg * zcosi * zsinh;
            a7 = -zcosg * zsinh + zsing * zcosi * zcosh;
            a8 = zsing * zsini;
            a9 = zsing * zsinh + zcosg * zcosi * zcosh;
            a10 = zcosg * zsini;
            a2 = cosim * a7 + sinim * a8;
            a4 = cosim * a9 + sinim * a10;
            a5 = -sinim * a7 + cosim * a8;
            a6 = -sinim * a9 + cosim * a10;
            x1 = a1 * cosomm + a2 * sinomm;
            x2 = a3 * cosomm + a4 * sinomm;
            x3 = -a1 * sinomm + a2 * cosomm;
            x4 = -a3 * sinomm + a4 * cosomm;
            x5 = a5 * sinomm;
            x6 = a6 * sinomm;
            x7 = a5 * cosomm;
            x8 = a6 * cosomm;
            z31 = 12.0 * x1 * x1 - 3.0 * x3 * x3;
            z32 = 24.0 * x1 * x2 - 6.0 * x3 * x4;
            z33 = 12.0 * x2 * x2 - 3.0 * x4 * x4;
            z1 = 3.0 * (a1 * a1 + a2 * a2) + z31 * emsq;
            z2 = 6.0 * (a1 * a3 + a2 * a4) + z32 * emsq;
            z3 = 3.0 * (a3 * a3 + a4 * a4) + z33 * emsq;
            z11 = -6.0 * a1 * a5 + emsq * (-24.0 * x1 * x7 - 6.0 * x3 * x5);
            z12 =
                -6.0 * (a1 * a6 + a3 * a5) +
                    emsq * (-24.0 * (x2 * x7 + x1 * x8) + -6.0 * (x3 * x6 + x4 * x5));
            z13 = -6.0 * a3 * a6 + emsq * (-24.0 * x2 * x8 - 6.0 * x4 * x6);
            z21 = 6.0 * a2 * a5 + emsq * (24.0 * x1 * x5 - 6.0 * x3 * x7);
            z22 =
                6.0 * (a4 * a5 + a2 * a6) +
                    emsq * (24.0 * (x2 * x5 + x1 * x6) - 6.0 * (x4 * x7 + x3 * x8));
            z23 = 6.0 * a4 * a6 + emsq * (24.0 * x2 * x6 - 6.0 * x4 * x8);
            z1 = z1 + z1 + betasq * z31;
            z2 = z2 + z2 + betasq * z32;
            z3 = z3 + z3 + betasq * z33;
            s3 = cc * xnoi;
            s2 = (-0.5 * s3) / rtemsq;
            s4 = s3 * rtemsq;
            s1 = -15.0 * em * s4;
            s5 = x1 * x3 + x2 * x4;
            s6 = x2 * x3 + x1 * x4;
            s7 = x2 * x4 - x1 * x3;
            //  ----------------------- do lunar terms -------------------
            if (lsflg === 1) {
                ss1 = s1;
                ss2 = s2;
                ss3 = s3;
                ss4 = s4;
                ss5 = s5;
                ss6 = s6;
                ss7 = s7;
                sz1 = z1;
                sz2 = z2;
                sz3 = z3;
                sz11 = z11;
                sz12 = z12;
                sz13 = z13;
                sz21 = z21;
                sz22 = z22;
                sz23 = z23;
                sz31 = z31;
                sz32 = z32;
                sz33 = z33;
                zcosg = zcosgl;
                zsing = zsingl;
                zcosi = zcosil;
                zsini = zsinil;
                zcosh = zcoshl * cnodm + zsinhl * snodm;
                zsinh = snodm * zcoshl - cnodm * zsinhl;
                cc = c1l;
            }
        }
        const zmol = (4.7199672 + (0.2299715 * day - gam)) % constants_js_2.twoPi;
        const zmos = (6.2565837 + 0.017201977 * day) % constants_js_2.twoPi;
        //  ------------------------ do solar terms ----------------------
        const se2 = 2.0 * ss1 * ss6;
        const se3 = 2.0 * ss1 * ss7;
        const si2 = 2.0 * ss2 * sz12;
        const si3 = 2.0 * ss2 * (sz13 - sz11);
        const sl2 = -2.0 * ss3 * sz2;
        const sl3 = -2.0 * ss3 * (sz3 - sz1);
        const sl4 = -2.0 * ss3 * (-21.0 - 9.0 * emsq) * zes;
        const sgh2 = 2.0 * ss4 * sz32;
        const sgh3 = 2.0 * ss4 * (sz33 - sz31);
        const sgh4 = -18.0 * ss4 * zes;
        const sh2 = -2.0 * ss2 * sz22;
        const sh3 = -2.0 * ss2 * (sz23 - sz21);
        //  ------------------------ do lunar terms ----------------------
        const ee2 = 2.0 * s1 * s6;
        const e3 = 2.0 * s1 * s7;
        const xi2 = 2.0 * s2 * z12;
        const xi3 = 2.0 * s2 * (z13 - z11);
        const xl2 = -2.0 * s3 * z2;
        const xl3 = -2.0 * s3 * (z3 - z1);
        const xl4 = -2.0 * s3 * (-21.0 - 9.0 * emsq) * zel;
        const xgh2 = 2.0 * s4 * z32;
        const xgh3 = 2.0 * s4 * (z33 - z31);
        const xgh4 = -18.0 * s4 * zel;
        const xh2 = -2.0 * s2 * z22;
        const xh3 = -2.0 * s2 * (z23 - z21);
        return {
            snodm,
            cnodm,
            sinim,
            cosim,
            sinomm,
            cosomm,
            day,
            e3,
            ee2,
            em,
            emsq,
            gam,
            peo,
            pgho,
            pho,
            pinco,
            plo,
            rtemsq,
            se2,
            se3,
            sgh2,
            sgh3,
            sgh4,
            sh2,
            sh3,
            si2,
            si3,
            sl2,
            sl3,
            sl4,
            s1: s1,
            s2: s2,
            s3: s3,
            s4: s4,
            s5: s5,
            s6: s6,
            s7: s7,
            ss1: ss1,
            ss2: ss2,
            ss3: ss3,
            ss4: ss4,
            ss5: ss5,
            ss6: ss6,
            ss7: ss7,
            sz1: sz1,
            sz2: sz2,
            sz3: sz3,
            sz11: sz11,
            sz12: sz12,
            sz13: sz13,
            sz21: sz21,
            sz22: sz22,
            sz23: sz23,
            sz31: sz31,
            sz32: sz32,
            sz33: sz33,
            xgh2,
            xgh3,
            xgh4,
            xh2,
            xh3,
            xi2,
            xi3,
            xl2,
            xl3,
            xl4,
            nm,
            z1: z1,
            z2: z2,
            z3: z3,
            z11: z11,
            z12: z12,
            z13: z13,
            z21: z21,
            z22: z22,
            z23: z23,
            z31: z31,
            z32: z32,
            z33: z33,
            zmol,
            zmos,
        };
    }
});
define("propagation/dsinit", ["require", "exports", "constants"], function (require, exports, constants_js_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.dsinit = dsinit;
    /*-----------------------------------------------------------------------------
     *
     *                           procedure dsinit
     *
     *  this procedure provides deep space contributions to mean motion dot due
     *    to geopotential resonance with half day and one day orbits.
     *
     *  author        : david vallado                  719-573-2600   28 jun 2005
     *
     *  inputs        :
     *    cosim, sinim-
     *    emsq        - eccentricity squared
     *    argpo       - argument of perigee
     *    s1, s2, s3, s4, s5      -
     *    ss1, ss2, ss3, ss4, ss5 -
     *    sz1, sz3, sz11, sz13, sz21, sz23, sz31, sz33 -
     *    t           - time
     *    tc          -
     *    gsto        - greenwich sidereal time                   rad
     *    mo          - mean anomaly
     *    mdot        - mean anomaly dot (rate)
     *    no          - mean motion
     *    nodeo       - right ascension of ascending node
     *    nodedot     - right ascension of ascending node dot (rate)
     *    xpidot      -
     *    z1, z3, z11, z13, z21, z23, z31, z33 -
     *    eccm        - eccentricity
     *    argpm       - argument of perigee
     *    inclm       - inclination
     *    mm          - mean anomaly
     *    xn          - mean motion
     *    nodem       - right ascension of ascending node
     *
     *  outputs       :
     *    em          - eccentricity
     *    argpm       - argument of perigee
     *    inclm       - inclination
     *    mm          - mean anomaly
     *    nm          - mean motion
     *    nodem       - right ascension of ascending node
     *    irez        - flag for resonance           0-none, 1-one day, 2-half day
     *    atime       -
     *    d2201, d2211, d3210, d3222, d4410, d4422, d5220, d5232, d5421, d5433    -
     *    dedt        -
     *    didt        -
     *    dmdt        -
     *    dndt        -
     *    dnodt       -
     *    domdt       -
     *    del1, del2, del3        -
     *    ses  , sghl , sghs , sgs  , shl  , shs  , sis  , sls
     *    theta       -
     *    xfact       -
     *    xlamo       -
     *    xli         -
     *    xni
     *
     *  locals        :
     *    ainv2       -
     *    aonv        -
     *    cosisq      -
     *    eoc         -
     *    f220, f221, f311, f321, f322, f330, f441, f442, f522, f523, f542, f543  -
     *    g200, g201, g211, g300, g310, g322, g410, g422, g520, g521, g532, g533  -
     *    sini2       -
     *    temp        -
     *    temp1       -
     *    theta       -
     *    xno2        -
     *
     *  coupling      :
     *    getgravconst
     *
     *  references    :
     *    hoots, roehrich, norad spacetrack report #3 1980
     *    hoots, norad spacetrack report #6 1986
     *    hoots, schumacher and glover 2004
     *    vallado, crawford, hujsak, kelso  2006
     ----------------------------------------------------------------------------*/
    function dsinit(options) {
        const { cosim, argpo, s1, s2, s3, s4, s5, sinim, ss1, ss2, ss3, ss4, ss5, sz1, sz3, sz11, sz13, sz21, sz23, sz31, sz33, t, tc, gsto, mo, mdot, no, nodeo, nodedot, xpidot, z1, z3, z11, z13, z21, z23, z31, z33, ecco, eccsq, } = options;
        let { emsq, em, argpm, inclm, mm, nm, nodem, irez, atime, d2201, d2211, d3210, d3222, d4410, d4422, d5220, d5232, d5421, d5433, dedt, didt, dmdt, dnodt, domdt, del1, del2, del3, xfact, xlamo, xli, xni, } = options;
        let f220;
        let f221;
        let f311;
        let f321;
        let f322;
        let f330;
        let f441;
        let f442;
        let f522;
        let f523;
        let f542;
        let f543;
        let g200;
        let g201;
        let g211;
        let g300;
        let g310;
        let g322;
        let g410;
        let g422;
        let g520;
        let g521;
        let g532;
        let g533;
        let sini2;
        let temp;
        let temp1;
        let xno2;
        let ainv2;
        let aonv;
        let cosisq;
        let eoc;
        const q22 = 1.7891679e-6;
        const q31 = 2.1460748e-6;
        const q33 = 2.2123015e-7;
        const root22 = 1.7891679e-6;
        const root44 = 7.3636953e-9;
        const root54 = 2.1765803e-9;
        // biome-ignore lint/correctness/noPrecisionLoss: keep original value for search
        const rptim = 4.37526908801129966e-3; // equates to 7.29211514668855e-5 rad/sec
        const root32 = 3.7393792e-7;
        const root52 = 1.1428639e-7;
        const znl = 1.5835218e-4;
        const zns = 1.19459e-5;
        // -------------------- deep space initialization ------------
        irez = 0;
        if (nm < 0.0052359877 && nm > 0.0034906585) {
            irez = 1;
        }
        if (nm >= 8.26e-3 && nm <= 9.24e-3 && em >= 0.5) {
            irez = 2;
        }
        // ------------------------ do solar terms -------------------
        const ses = ss1 * zns * ss5;
        const sis = ss2 * zns * (sz11 + sz13);
        const sls = -zns * ss3 * (sz1 + sz3 - 14.0 - 6.0 * emsq);
        const sghs = ss4 * zns * (sz31 + sz33 - 6.0);
        let shs = -zns * ss2 * (sz21 + sz23);
        // sgp4fix for 180 deg incl
        if (inclm < 5.2359877e-2 || inclm > constants_js_3.pi - 5.2359877e-2) {
            shs = 0.0;
        }
        if (sinim !== 0.0) {
            shs /= sinim;
        }
        const sgs = sghs - cosim * shs;
        // ------------------------- do lunar terms ------------------
        dedt = ses + s1 * znl * s5;
        didt = sis + s2 * znl * (z11 + z13);
        dmdt = sls - znl * s3 * (z1 + z3 - 14.0 - 6.0 * emsq);
        const sghl = s4 * znl * (z31 + z33 - 6.0);
        let shll = -znl * s2 * (z21 + z23);
        // sgp4fix for 180 deg incl
        if (inclm < 5.2359877e-2 || inclm > constants_js_3.pi - 5.2359877e-2) {
            shll = 0.0;
        }
        domdt = sgs + sghl;
        dnodt = shs;
        if (sinim !== 0.0) {
            domdt -= (cosim / sinim) * shll;
            dnodt += shll / sinim;
        }
        // ----------- calculate deep space resonance effects --------
        const dndt = 0.0;
        const theta = (gsto + tc * rptim) % constants_js_3.twoPi;
        em += dedt * t;
        inclm += didt * t;
        argpm += domdt * t;
        nodem += dnodt * t;
        mm += dmdt * t;
        // sgp4fix for negative inclinations
        // the following if statement should be commented out
        // if (inclm < 0.0)
        // {
        //   inclm  = -inclm;
        //   argpm  = argpm - pi;
        //   nodem = nodem + pi;
        // }
        // -------------- initialize the resonance terms -------------
        if (irez !== 0) {
            aonv = (nm / constants_js_3.xke) ** constants_js_3.x2o3;
            // ---------- geopotential resonance for 12 hour orbits ------
            if (irez === 2) {
                cosisq = cosim * cosim;
                const emo = em;
                em = ecco;
                const emsqo = emsq;
                emsq = eccsq;
                eoc = em * emsq;
                g201 = -0.306 - (em - 0.64) * 0.44;
                if (em <= 0.65) {
                    g211 = 3.616 - 13.247 * em + 16.29 * emsq;
                    g310 = -19.302 + 117.39 * em - 228.419 * emsq + 156.591 * eoc;
                    g322 = -18.9068 + 109.7927 * em - 214.6334 * emsq + 146.5816 * eoc;
                    g410 = -41.122 + 242.694 * em - 471.094 * emsq + 313.953 * eoc;
                    g422 = -146.407 + 841.88 * em - 1629.014 * emsq + 1083.435 * eoc;
                    g520 = -532.114 + 3017.977 * em - 5740.032 * emsq + 3708.276 * eoc;
                }
                else {
                    g211 = -72.099 + 331.819 * em - 508.738 * emsq + 266.724 * eoc;
                    g310 = -346.844 + 1582.851 * em - 2415.925 * emsq + 1246.113 * eoc;
                    g322 = -342.585 + 1554.908 * em - 2366.899 * emsq + 1215.972 * eoc;
                    g410 = -1052.797 + 4758.686 * em - 7193.992 * emsq + 3651.957 * eoc;
                    g422 = -3581.69 + 16178.11 * em - 24462.77 * emsq + 12422.52 * eoc;
                    if (em > 0.715) {
                        g520 = -5149.66 + 29936.92 * em - 54087.36 * emsq + 31324.56 * eoc;
                    }
                    else {
                        g520 = 1464.74 - 4664.75 * em + 3763.64 * emsq;
                    }
                }
                if (em < 0.7) {
                    g533 = -919.2277 + 4988.61 * em - 9064.77 * emsq + 5542.21 * eoc;
                    g521 = -822.71072 + 4568.6173 * em - 8491.4146 * emsq + 5337.524 * eoc;
                    g532 = -853.666 + 4690.25 * em - 8624.77 * emsq + 5341.4 * eoc;
                }
                else {
                    g533 = -37995.78 + 161616.52 * em - 229838.2 * emsq + 109377.94 * eoc;
                    g521 = -51752.104 + 218913.95 * em - 309468.16 * emsq + 146349.42 * eoc;
                    g532 = -40023.88 + 170470.89 * em - 242699.48 * emsq + 115605.82 * eoc;
                }
                sini2 = sinim * sinim;
                f220 = 0.75 * (1.0 + 2.0 * cosim + cosisq);
                f221 = 1.5 * sini2;
                f321 = 1.875 * sinim * (1.0 - 2.0 * cosim - 3.0 * cosisq);
                f322 = -1.875 * sinim * (1.0 + 2.0 * cosim - 3.0 * cosisq);
                f441 = 35.0 * sini2 * f220;
                f442 = 39.375 * sini2 * sini2;
                f522 =
                    9.84375 *
                        sinim *
                        (sini2 * (1.0 - 2.0 * cosim - 5.0 * cosisq) +
                            0.33333333 * (-2.0 + 4.0 * cosim + 6.0 * cosisq));
                f523 =
                    sinim *
                        (4.92187512 * sini2 * (-2.0 - 4.0 * cosim + 10.0 * cosisq) +
                            6.56250012 * (1.0 + 2.0 * cosim - 3.0 * cosisq));
                f542 =
                    29.53125 *
                        sinim *
                        (2.0 - 8.0 * cosim + cosisq * (-12.0 + 8.0 * cosim + 10.0 * cosisq));
                f543 =
                    29.53125 *
                        sinim *
                        (-2.0 - 8.0 * cosim + cosisq * (12.0 + 8.0 * cosim - 10.0 * cosisq));
                xno2 = nm * nm;
                ainv2 = aonv * aonv;
                temp1 = 3.0 * xno2 * ainv2;
                temp = temp1 * root22;
                d2201 = temp * f220 * g201;
                d2211 = temp * f221 * g211;
                temp1 *= aonv;
                temp = temp1 * root32;
                d3210 = temp * f321 * g310;
                d3222 = temp * f322 * g322;
                temp1 *= aonv;
                temp = 2.0 * temp1 * root44;
                d4410 = temp * f441 * g410;
                d4422 = temp * f442 * g422;
                temp1 *= aonv;
                temp = temp1 * root52;
                d5220 = temp * f522 * g520;
                d5232 = temp * f523 * g532;
                temp = 2.0 * temp1 * root54;
                d5421 = temp * f542 * g521;
                d5433 = temp * f543 * g533;
                xlamo = (mo + nodeo + nodeo - (theta + theta)) % constants_js_3.twoPi;
                xfact = mdot + dmdt + 2.0 * (nodedot + dnodt - rptim) - no;
                em = emo;
                emsq = emsqo;
            }
            //  ---------------- synchronous resonance terms --------------
            if (irez === 1) {
                g200 = 1.0 + emsq * (-2.5 + 0.8125 * emsq);
                g310 = 1.0 + 2.0 * emsq;
                g300 = 1.0 + emsq * (-6.0 + 6.60937 * emsq);
                f220 = 0.75 * (1.0 + cosim) * (1.0 + cosim);
                f311 =
                    0.9375 * sinim * sinim * (1.0 + 3.0 * cosim) - 0.75 * (1.0 + cosim);
                f330 = 1.0 + cosim;
                f330 = 1.875 * f330 * f330 * f330;
                del1 = 3.0 * nm * nm * aonv * aonv;
                del2 = 2.0 * del1 * f220 * g200 * q22;
                del3 = 3.0 * del1 * f330 * g300 * q33 * aonv;
                del1 = del1 * f311 * g310 * q31 * aonv;
                xlamo = (mo + nodeo + argpo - theta) % constants_js_3.twoPi;
                xfact = mdot + xpidot + dmdt + domdt + dnodt - (no + rptim);
            }
            //  ------------ for sgp4, initialize the integrator ----------
            xli = xlamo;
            xni = no;
            atime = 0.0;
            nm = no + dndt;
        }
        return {
            em,
            argpm,
            inclm,
            mm,
            nm,
            nodem,
            irez,
            atime,
            d2201,
            d2211,
            d3210,
            d3222,
            d4410,
            d4422,
            d5220,
            d5232,
            d5421,
            d5433,
            dedt,
            didt,
            dmdt,
            dndt,
            dnodt,
            domdt,
            del1,
            del2,
            del3,
            xfact,
            xlamo,
            xli,
            xni,
        };
    }
});
define("propagation/gstime", ["require", "exports", "constants", "ext"], function (require, exports, constants_js_4, ext_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.gstime = gstime;
    /* -----------------------------------------------------------------------------
     *
     *                           function gstime
     *
     *  this function finds the greenwich sidereal time.
     *
     *  author        : david vallado                  719-573-2600    1 mar 2001
     *
     *  inputs          description                    range / units
     *    jdut1       - julian date in ut1             days from 4713 bc
     *
     *  outputs       :
     *    gstime      - greenwich sidereal time        0 to 2pi rad
     *
     *  locals        :
     *    temp        - temporary variable for doubles   rad
     *    tut1        - julian centuries from the
     *                  jan 1, 2000 12 h epoch (ut1)
     *
     *  coupling      :
     *    none
     *
     *  references    :
     *    vallado       2004, 191, eq 3-45
     * --------------------------------------------------------------------------- */
    function gstimeInternal(jdut1) {
        const tut1 = (jdut1 - 2451545.0) / 36525.0;
        let temp = -6.2e-6 * tut1 * tut1 * tut1 +
            0.093104 * tut1 * tut1 +
            (876600.0 * 3600 + 8640184.812866) * tut1 +
            67310.54841; // # sec
        temp = ((temp * constants_js_4.deg2rad) / 240.0) % constants_js_4.twoPi; // 360/86400 = 1/240, to deg, to rad
        //  ------------------------ check quadrants ---------------------
        if (temp < 0.0) {
            temp += constants_js_4.twoPi;
        }
        return temp;
    }
    function gstime(first, month, day, hour, minute, second, millisecond) {
        if (first instanceof Date) {
            return gstimeInternal((0, ext_js_1.jday)(first));
        }
        if (month !== undefined) {
            return gstimeInternal(
            // biome-ignore lint/style/noNonNullAssertion: overloads make sure those are non-null
            (0, ext_js_1.jday)(first, month, day, hour, minute, second, millisecond));
        }
        return gstimeInternal(first);
    }
});
define("propagation/initl", ["require", "exports", "constants", "propagation/gstime"], function (require, exports, constants_js_5, gstime_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.initl = initl;
    /*-----------------------------------------------------------------------------
     *
     *                           procedure initl
     *
     *  this procedure initializes the sgp4 propagator. all the initialization is
     *    consolidated here instead of having multiple loops inside other routines.
     *
     *  author        : david vallado                  719-573-2600   28 jun 2005
     *
     *  inputs        :
     *    ecco        - eccentricity                           0.0 - 1.0
     *    epoch       - epoch time in days from jan 0, 1950. 0 hr
     *    inclo       - inclination of satellite
     *    no          - mean motion of satellite
     *    satn        - satellite number
     *
     *  outputs       :
     *    ainv        - 1.0 / a
     *    ao          - semi major axis
     *    con41       -
     *    con42       - 1.0 - 5.0 cos(i)
     *    cosio       - cosine of inclination
     *    cosio2      - cosio squared
     *    eccsq       - eccentricity squared
     *    method      - flag for deep space                    'd', 'n'
     *    omeosq      - 1.0 - ecco * ecco
     *    posq        - semi-parameter squared
     *    rp          - radius of perigee
     *    rteosq      - square root of (1.0 - ecco*ecco)
     *    sinio       - sine of inclination
     *    gsto        - gst at time of observation               rad
     *    no          - mean motion of satellite
     *
     *  locals        :
     *    ak          -
     *    d1          -
     *    del         -
     *    adel        -
     *    po          -
     *
     *  coupling      :
     *    getgravconst
     *    gstime      - find greenwich sidereal time from the julian date
     *
     *  references    :
     *    hoots, roehrich, norad spacetrack report #3 1980
     *    hoots, norad spacetrack report #6 1986
     *    hoots, schumacher and glover 2004
     *    vallado, crawford, hujsak, kelso  2006
     ----------------------------------------------------------------------------*/
    function initl(options) {
        const { ecco, epoch, inclo, opsmode } = options;
        let { no } = options;
        // sgp4fix use old way of finding gst
        // ----------------------- earth constants ---------------------
        // sgp4fix identify constants and allow alternate values
        // ------------- calculate auxillary epoch quantities ----------
        const eccsq = ecco * ecco;
        const omeosq = 1.0 - eccsq;
        const rteosq = Math.sqrt(omeosq);
        const cosio = Math.cos(inclo);
        const cosio2 = cosio * cosio;
        // ------------------ un-kozai the mean motion -----------------
        const ak = (constants_js_5.xke / no) ** constants_js_5.x2o3;
        const d1 = (0.75 * constants_js_5.j2 * (3.0 * cosio2 - 1.0)) / (rteosq * omeosq);
        let delPrime = d1 / (ak * ak);
        const adel = ak *
            (1.0 -
                delPrime * delPrime -
                delPrime * (1.0 / 3.0 + (134.0 * delPrime * delPrime) / 81.0));
        delPrime = d1 / (adel * adel);
        no /= 1.0 + delPrime;
        const ao = (constants_js_5.xke / no) ** constants_js_5.x2o3;
        const sinio = Math.sin(inclo);
        const po = ao * omeosq;
        const con42 = 1.0 - 5.0 * cosio2;
        const con41 = -con42 - cosio2 - cosio2;
        const ainv = 1.0 / ao;
        const posq = po * po;
        const rp = ao * (1.0 - ecco);
        const method = 'n';
        //  sgp4fix modern approach to finding sidereal time
        let gsto;
        if (opsmode === 'a') {
            //  sgp4fix use old way of finding gst
            //  count integer number of days from 0 jan 1970
            const ts70 = epoch - 7305.0;
            const ds70 = Math.floor(ts70 + 1.0e-8);
            const tfrac = ts70 - ds70;
            // find greenwich location at epoch
            // biome-ignore-start lint/correctness/noPrecisionLoss: keep original values for search
            const c1 = 1.72027916940703639e-2;
            const thgr70 = 1.7321343856509374;
            const fk5r = 5.07551419432269442e-15;
            // biome-ignore-end lint/correctness/noPrecisionLoss: keep original values for search
            const c1p2p = c1 + constants_js_5.twoPi;
            gsto = (thgr70 + c1 * ds70 + c1p2p * tfrac + ts70 * ts70 * fk5r) % constants_js_5.twoPi;
            if (gsto < 0.0) {
                gsto += constants_js_5.twoPi;
            }
        }
        else {
            gsto = (0, gstime_js_1.gstime)(epoch + 2433281.5);
        }
        return {
            no,
            method,
            ainv,
            ao,
            con41,
            con42,
            cosio,
            cosio2,
            eccsq,
            omeosq,
            posq,
            rp,
            rteosq,
            sinio,
            gsto,
        };
    }
});
define("propagation/dspace", ["require", "exports", "constants"], function (require, exports, constants_js_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.dspace = dspace;
    /*-----------------------------------------------------------------------------
     *
     *                           procedure dspace
     *
     *  this procedure provides deep space contributions to mean elements for
     *    perturbing third body.  these effects have been averaged over one
     *    revolution of the sun and moon.  for earth resonance effects, the
     *    effects have been averaged over no revolutions of the satellite.
     *    (mean motion)
     *
     *  author        : david vallado                  719-573-2600   28 jun 2005
     *
     *  inputs        :
     *    d2201, d2211, d3210, d3222, d4410, d4422, d5220, d5232, d5421, d5433 -
     *    dedt        -
     *    del1, del2, del3  -
     *    didt        -
     *    dmdt        -
     *    dnodt       -
     *    domdt       -
     *    irez        - flag for resonance           0-none, 1-one day, 2-half day
     *    argpo       - argument of perigee
     *    argpdot     - argument of perigee dot (rate)
     *    t           - time
     *    tc          -
     *    gsto        - gst
     *    xfact       -
     *    xlamo       -
     *    no          - mean motion
     *    atime       -
     *    em          - eccentricity
     *    ft          -
     *    argpm       - argument of perigee
     *    inclm       - inclination
     *    xli         -
     *    mm          - mean anomaly
     *    xni         - mean motion
     *    nodem       - right ascension of ascending node
     *
     *  outputs       :
     *    atime       -
     *    em          - eccentricity
     *    argpm       - argument of perigee
     *    inclm       - inclination
     *    xli         -
     *    mm          - mean anomaly
     *    xni         -
     *    nodem       - right ascension of ascending node
     *    dndt        -
     *    nm          - mean motion
     *
     *  locals        :
     *    delt        -
     *    ft          -
     *    theta       -
     *    x2li        -
     *    x2omi       -
     *    xl          -
     *    xldot       -
     *    xnddt       -
     *    xndt        -
     *    xomi        -
     *
     *  coupling      :
     *    none        -
     *
     *  references    :
     *    hoots, roehrich, norad spacetrack report #3 1980
     *    hoots, norad spacetrack report #6 1986
     *    hoots, schumacher and glover 2004
     *    vallado, crawford, hujsak, kelso  2006
     ----------------------------------------------------------------------------*/
    function dspace(options) {
        const { irez, d2201, d2211, d3210, d3222, d4410, d4422, d5220, d5232, d5421, d5433, dedt, del1, del2, del3, didt, dmdt, dnodt, domdt, argpo, argpdot, t, tc, gsto, xfact, xlamo, no, } = options;
        let { atime, em, argpm, inclm, xli, mm, xni, nodem, nm } = options;
        const fasx2 = 0.13130908;
        const fasx4 = 2.8843198;
        const fasx6 = 0.37448087;
        const g22 = 5.7686396;
        const g32 = 0.95240898;
        const g44 = 1.8014998;
        const g52 = 1.050833;
        const g54 = 4.4108898;
        // biome-ignore lint/correctness/noPrecisionLoss: keep original value for search
        const rptim = 4.37526908801129966e-3; // equates to 7.29211514668855e-5 rad/sec
        const stepp = 720.0;
        const stepn = -720.0;
        const step2 = 259200.0;
        let delt;
        let x2li;
        let x2omi;
        let xl;
        let xldot;
        let xnddt;
        let xndt;
        let xomi;
        let dndt = 0.0;
        let ft = 0.0;
        //  ----------- calculate deep space resonance effects -----------
        const theta = (gsto + tc * rptim) % constants_js_6.twoPi;
        em += dedt * t;
        inclm += didt * t;
        argpm += domdt * t;
        nodem += dnodt * t;
        mm += dmdt * t;
        // sgp4fix for negative inclinations
        // the following if statement should be commented out
        // if (inclm < 0.0)
        // {
        //   inclm = -inclm;
        //   argpm = argpm - pi;
        //   nodem = nodem + pi;
        // }
        /* - update resonances : numerical (euler-maclaurin) integration - */
        /* ------------------------- epoch restart ----------------------  */
        //   sgp4fix for propagator problems
        //   the following integration works for negative time steps and periods
        //   the specific changes are unknown because the original code was so convoluted
        // sgp4fix take out atime = 0.0 and fix for faster operation
        if (irez !== 0) {
            //  sgp4fix streamline check
            if (atime === 0.0 || t * atime <= 0.0 || Math.abs(t) < Math.abs(atime)) {
                atime = 0.0;
                xni = no;
                xli = xlamo;
            }
            // sgp4fix move check outside loop
            if (t > 0.0) {
                delt = stepp;
            }
            else {
                delt = stepn;
            }
            let iretn = 381; // added for do loop
            while (iretn === 381) {
                //  ------------------- dot terms calculated -------------
                //  ----------- near - synchronous resonance terms -------
                if (irez !== 2) {
                    xndt =
                        del1 * Math.sin(xli - fasx2) +
                            del2 * Math.sin(2.0 * (xli - fasx4)) +
                            del3 * Math.sin(3.0 * (xli - fasx6));
                    xldot = xni + xfact;
                    xnddt =
                        del1 * Math.cos(xli - fasx2) +
                            2.0 * del2 * Math.cos(2.0 * (xli - fasx4)) +
                            3.0 * del3 * Math.cos(3.0 * (xli - fasx6));
                    xnddt *= xldot;
                }
                else {
                    // --------- near - half-day resonance terms --------
                    xomi = argpo + argpdot * atime;
                    x2omi = xomi + xomi;
                    x2li = xli + xli;
                    xndt =
                        d2201 * Math.sin(x2omi + xli - g22) +
                            d2211 * Math.sin(xli - g22) +
                            d3210 * Math.sin(xomi + xli - g32) +
                            d3222 * Math.sin(-xomi + xli - g32) +
                            d4410 * Math.sin(x2omi + x2li - g44) +
                            d4422 * Math.sin(x2li - g44) +
                            d5220 * Math.sin(xomi + xli - g52) +
                            d5232 * Math.sin(-xomi + xli - g52) +
                            d5421 * Math.sin(xomi + x2li - g54) +
                            d5433 * Math.sin(-xomi + x2li - g54);
                    xldot = xni + xfact;
                    xnddt =
                        d2201 * Math.cos(x2omi + xli - g22) +
                            d2211 * Math.cos(xli - g22) +
                            d3210 * Math.cos(xomi + xli - g32) +
                            d3222 * Math.cos(-xomi + xli - g32) +
                            d5220 * Math.cos(xomi + xli - g52) +
                            d5232 * Math.cos(-xomi + xli - g52) +
                            2.0 *
                                (d4410 * Math.cos(x2omi + x2li - g44) +
                                    d4422 * Math.cos(x2li - g44) +
                                    d5421 * Math.cos(xomi + x2li - g54) +
                                    d5433 * Math.cos(-xomi + x2li - g54));
                    xnddt *= xldot;
                }
                //  ----------------------- integrator -------------------
                //  sgp4fix move end checks to end of routine
                if (Math.abs(t - atime) >= stepp) {
                    iretn = 381;
                }
                else {
                    ft = t - atime;
                    iretn = 0;
                }
                if (iretn === 381) {
                    xli += xldot * delt + xndt * step2;
                    xni += xndt * delt + xnddt * step2;
                    atime += delt;
                }
            }
            nm = xni + xndt * ft + xnddt * ft * ft * 0.5;
            xl = xli + xldot * ft + xndt * ft * ft * 0.5;
            if (irez !== 1) {
                mm = xl - 2.0 * nodem + 2.0 * theta;
                dndt = nm - no;
            }
            else {
                mm = xl - nodem - argpm + theta;
                dndt = nm - no;
            }
            nm = no + dndt;
        }
        return {
            atime,
            em,
            argpm,
            inclm,
            xli,
            mm,
            xni,
            nodem,
            dndt,
            nm,
        };
    }
});
define("propagation/sgp4", ["require", "exports", "constants", "propagation/dpper", "propagation/dspace", "propagation/SatRec"], function (require, exports, constants_js_7, dpper_js_1, dspace_js_1, SatRec_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sgp4 = sgp4;
    /*----------------------------------------------------------------------------
     *
     *                             procedure sgp4
     *
     *  this procedure is the sgp4 prediction model from space command. this is an
     *    updated and combined version of sgp4 and sdp4, which were originally
     *    published separately in spacetrack report //3. this version follows the
     *    methodology from the aiaa paper (2006) describing the history and
     *    development of the code.
     *
     *  author        : david vallado                  719-573-2600   28 jun 2005
     *
     *  inputs        :
     *    satrec  - initialised structure from sgp4init() call.
     *    tsince  - time since epoch (minutes)
     *
     *  outputs       :
     *    r           - position vector                     km
     *    v           - velocity                            km/sec
     *  return code - non-zero on error.
     *                   1 - mean elements, ecc >= 1.0 or ecc < -0.001 or a < 0.95 er
     *                   2 - mean motion less than 0.0
     *                   3 - pert elements, ecc < 0.0  or  ecc > 1.0
     *                   4 - semi-latus rectum < 0.0
     *                   5 - epoch elements are sub-orbital
     *                   6 - satellite has decayed
     *
     *  locals        :
     *    am          -
     *    axnl, aynl        -
     *    betal       -
     *    cosim   , sinim   , cosomm  , sinomm  , cnod    , snod    , cos2u   ,
     *    sin2u   , coseo1  , sineo1  , cosi    , sini    , cosip   , sinip   ,
     *    cosisq  , cossu   , sinsu   , cosu    , sinu
     *    delm        -
     *    delomg      -
     *    dndt        -
     *    eccm        -
     *    emsq        -
     *    ecose       -
     *    el2         -
     *    eo1         -
     *    eccp        -
     *    esine       -
     *    argpm       -
     *    argpp       -
     *    omgadf      -
     *    pl          -
     *    r           -
     *    rtemsq      -
     *    rdotl       -
     *    rl          -
     *    rvdot       -
     *    rvdotl      -
     *    su          -
     *    t2  , t3   , t4    , tc
     *    tem5, temp , temp1 , temp2  , tempa  , tempe  , templ
     *    u   , ux   , uy    , uz     , vx     , vy     , vz
     *    inclm       - inclination
     *    mm          - mean anomaly
     *    nm          - mean motion
     *    nodem       - right asc of ascending node
     *    xinc        -
     *    xincp       -
     *    xl          -
     *    xlm         -
     *    mp          -
     *    xmdf        -
     *    xmx         -
     *    xmy         -
     *    nodedf      -
     *    xnode       -
     *    nodep       -
     *    np          -
     *
     *  coupling      :
     *    getgravconst-
     *    dpper
     *    dspace
     *
     *  references    :
     *    hoots, roehrich, norad spacetrack report //3 1980
     *    hoots, norad spacetrack report //6 1986
     *    hoots, schumacher and glover 2004
     *    vallado, crawford, hujsak, kelso  2006
     ----------------------------------------------------------------------------*/
    function sgp4(satrec, tsince) {
        let coseo1;
        let sineo1;
        let cosip;
        let sinip;
        let cosisq;
        let delm;
        let delomg;
        let eo1;
        let argpm;
        let argpp;
        let su;
        let t3;
        let t4;
        let tc;
        let tem5;
        let temp;
        let tempa;
        let tempe;
        let templ;
        let inclm;
        let mm;
        let nm;
        let nodem;
        let xincp;
        let xlm;
        let mp;
        let nodep;
        /* ------------------ set mathematical constants --------------- */
        // sgp4fix divisor for divide by zero check on inclination
        // the old check used 1.0 + cos(pi-1.0e-9), but then compared it to
        // 1.5 e-12, so the threshold was changed to 1.5e-12 for consistency
        const temp4 = 1.5e-12;
        // --------------------- clear sgp4 error flag -----------------
        satrec.t = tsince;
        satrec.error = SatRec_js_1.SatRecError.None;
        //  ------- update for secular gravity and atmospheric drag -----
        const xmdf = satrec.mo + satrec.mdot * satrec.t;
        const argpdf = satrec.argpo + satrec.argpdot * satrec.t;
        const nodedf = satrec.nodeo + satrec.nodedot * satrec.t;
        argpm = argpdf;
        mm = xmdf;
        const t2 = satrec.t * satrec.t;
        nodem = nodedf + satrec.nodecf * t2;
        tempa = 1.0 - satrec.cc1 * satrec.t;
        tempe = satrec.bstar * satrec.cc4 * satrec.t;
        templ = satrec.t2cof * t2;
        if (satrec.isimp !== 1) {
            delomg = satrec.omgcof * satrec.t;
            //  sgp4fix use mutliply for speed instead of pow
            const delmtemp = 1.0 + satrec.eta * Math.cos(xmdf);
            delm = satrec.xmcof * (delmtemp * delmtemp * delmtemp - satrec.delmo);
            temp = delomg + delm;
            mm = xmdf + temp;
            argpm = argpdf - temp;
            t3 = t2 * satrec.t;
            t4 = t3 * satrec.t;
            tempa = tempa - satrec.d2 * t2 - satrec.d3 * t3 - satrec.d4 * t4;
            tempe += satrec.bstar * satrec.cc5 * (Math.sin(mm) - satrec.sinmao);
            templ =
                templ + satrec.t3cof * t3 + t4 * (satrec.t4cof + satrec.t * satrec.t5cof);
        }
        satrec.tempa = tempa;
        nm = satrec.no;
        let em = satrec.ecco;
        inclm = satrec.inclo;
        if (satrec.method === 'd') {
            tc = satrec.t;
            const dspaceOptions = {
                irez: satrec.irez,
                d2201: satrec.d2201,
                d2211: satrec.d2211,
                d3210: satrec.d3210,
                d3222: satrec.d3222,
                d4410: satrec.d4410,
                d4422: satrec.d4422,
                d5220: satrec.d5220,
                d5232: satrec.d5232,
                d5421: satrec.d5421,
                d5433: satrec.d5433,
                dedt: satrec.dedt,
                del1: satrec.del1,
                del2: satrec.del2,
                del3: satrec.del3,
                didt: satrec.didt,
                dmdt: satrec.dmdt,
                dnodt: satrec.dnodt,
                domdt: satrec.domdt,
                argpo: satrec.argpo,
                argpdot: satrec.argpdot,
                t: satrec.t,
                tc,
                gsto: satrec.gsto,
                xfact: satrec.xfact,
                xlamo: satrec.xlamo,
                no: satrec.no,
                atime: satrec.atime,
                em,
                argpm,
                inclm,
                xli: satrec.xli,
                mm,
                xni: satrec.xni,
                nodem,
                nm,
            };
            const dspaceResult = (0, dspace_js_1.dspace)(dspaceOptions);
            ({ em, argpm, inclm, mm, nodem, nm } = dspaceResult);
            satrec.atime = dspaceResult.atime;
            satrec.xli = dspaceResult.xli;
            satrec.xni = dspaceResult.xni;
        }
        if (nm <= 0.0) {
            // printf("// error nm %f\n", nm);
            satrec.error = SatRec_js_1.SatRecError.MeanMotionBelowZero;
            // sgp4fix add return
            return null;
        }
        const am = (constants_js_7.xke / nm) ** constants_js_7.x2o3 * tempa * tempa;
        nm = constants_js_7.xke / am ** 1.5;
        em -= tempe;
        // fix tolerance for error recognition
        // sgp4fix am is fixed from the previous nm check
        if (em >= 1.0 || em < -0.001) {
            // || (am < 0.95)
            // printf("// error em %f\n", em);
            satrec.error = SatRec_js_1.SatRecError.MeanEccentricityOutOfRange;
            // sgp4fix to return if there is an error in eccentricity
            return null;
        }
        //  sgp4fix fix tolerance to avoid a divide by zero
        if (em < 1.0e-6) {
            em = 1.0e-6;
        }
        mm += satrec.no * templ;
        xlm = mm + argpm + nodem;
        nodem %= constants_js_7.twoPi;
        argpm %= constants_js_7.twoPi;
        xlm %= constants_js_7.twoPi;
        mm = (xlm - argpm - nodem) % constants_js_7.twoPi;
        const meanElements = {
            am,
            em,
            im: inclm,
            Om: nodem,
            om: argpm,
            mm,
            nm,
        };
        // ----------------- compute extra mean quantities -------------
        const sinim = Math.sin(inclm);
        const cosim = Math.cos(inclm);
        // -------------------- add lunar-solar periodics --------------
        let ep = em;
        xincp = inclm;
        argpp = argpm;
        nodep = nodem;
        mp = mm;
        sinip = sinim;
        cosip = cosim;
        if (satrec.method === 'd') {
            const dpperParameters = {
                inclo: satrec.inclo,
                init: 'n',
                ep,
                inclp: xincp,
                nodep,
                argpp,
                mp,
                opsmode: satrec.operationmode,
            };
            const dpperResult = (0, dpper_js_1.dpper)(satrec, dpperParameters);
            ({ ep, nodep, argpp, mp } = dpperResult);
            xincp = dpperResult.inclp;
            if (xincp < 0.0) {
                xincp = -xincp;
                nodep += constants_js_7.pi;
                argpp -= constants_js_7.pi;
            }
            if (ep < 0.0 || ep > 1.0) {
                //  printf("// error ep %f\n", ep);
                satrec.error = SatRec_js_1.SatRecError.PerturbedEccentricityOutOfRange;
                //  sgp4fix add return
                return null;
            }
        }
        //  -------------------- long period periodics ------------------
        if (satrec.method === 'd') {
            sinip = Math.sin(xincp);
            cosip = Math.cos(xincp);
            satrec.aycof = -0.5 * constants_js_7.j3oj2 * sinip;
            //  sgp4fix for divide by zero for xincp = 180 deg
            if (Math.abs(cosip + 1.0) > 1.5e-12) {
                satrec.xlcof =
                    (-0.25 * constants_js_7.j3oj2 * sinip * (3.0 + 5.0 * cosip)) / (1.0 + cosip);
            }
            else {
                satrec.xlcof = (-0.25 * constants_js_7.j3oj2 * sinip * (3.0 + 5.0 * cosip)) / temp4;
            }
        }
        const axnl = ep * Math.cos(argpp);
        temp = 1.0 / (am * (1.0 - ep * ep));
        const aynl = ep * Math.sin(argpp) + temp * satrec.aycof;
        const xl = mp + argpp + nodep + temp * satrec.xlcof * axnl;
        // --------------------- solve kepler's equation ---------------
        const u = (xl - nodep) % constants_js_7.twoPi;
        eo1 = u;
        tem5 = 9999.9;
        let ktr = 1;
        //    sgp4fix for kepler iteration
        //    the following iteration needs better limits on corrections
        while (Math.abs(tem5) >= 1.0e-12 && ktr <= 10) {
            sineo1 = Math.sin(eo1);
            coseo1 = Math.cos(eo1);
            tem5 = 1.0 - coseo1 * axnl - sineo1 * aynl;
            tem5 = (u - aynl * coseo1 + axnl * sineo1 - eo1) / tem5;
            if (Math.abs(tem5) >= 0.95) {
                if (tem5 > 0.0) {
                    tem5 = 0.95;
                }
                else {
                    tem5 = -0.95;
                }
            }
            eo1 += tem5;
            ktr += 1;
        }
        //  ------------- short period preliminary quantities -----------
        const ecose = axnl * coseo1 + aynl * sineo1;
        const esine = axnl * sineo1 - aynl * coseo1;
        const el2 = axnl * axnl + aynl * aynl;
        const pl = am * (1.0 - el2);
        if (pl < 0.0) {
            //  printf("// error pl %f\n", pl);
            satrec.error = SatRec_js_1.SatRecError.SemiLatusRectumBelowZero;
            //  sgp4fix add return
            return null;
        }
        const rl = am * (1.0 - ecose);
        const rdotl = (Math.sqrt(am) * esine) / rl;
        const rvdotl = Math.sqrt(pl) / rl;
        const betal = Math.sqrt(1.0 - el2);
        temp = esine / (1.0 + betal);
        const sinu = (am / rl) * (sineo1 - aynl - axnl * temp);
        const cosu = (am / rl) * (coseo1 - axnl + aynl * temp);
        su = Math.atan2(sinu, cosu);
        const sin2u = (cosu + cosu) * sinu;
        const cos2u = 1.0 - 2.0 * sinu * sinu;
        temp = 1.0 / pl;
        const temp1 = 0.5 * constants_js_7.j2 * temp;
        const temp2 = temp1 * temp;
        // -------------- update for short period periodics ------------
        if (satrec.method === 'd') {
            cosisq = cosip * cosip;
            satrec.con41 = 3.0 * cosisq - 1.0;
            satrec.x1mth2 = 1.0 - cosisq;
            satrec.x7thm1 = 7.0 * cosisq - 1.0;
        }
        const mrt = rl * (1.0 - 1.5 * temp2 * betal * satrec.con41) +
            0.5 * temp1 * satrec.x1mth2 * cos2u;
        // sgp4fix for decaying satellites
        if (mrt < 1.0) {
            // printf("// decay condition %11.6f \n",mrt);
            satrec.error = SatRec_js_1.SatRecError.Decayed;
            return null;
        }
        su -= 0.25 * temp2 * satrec.x7thm1 * sin2u;
        const xnode = nodep + 1.5 * temp2 * cosip * sin2u;
        const xinc = xincp + 1.5 * temp2 * cosip * sinip * cos2u;
        const mvt = rdotl - (nm * temp1 * satrec.x1mth2 * sin2u) / constants_js_7.xke;
        const rvdot = rvdotl + (nm * temp1 * (satrec.x1mth2 * cos2u + 1.5 * satrec.con41)) / constants_js_7.xke;
        // --------------------- orientation vectors -------------------
        const sinsu = Math.sin(su);
        const cossu = Math.cos(su);
        const snod = Math.sin(xnode);
        const cnod = Math.cos(xnode);
        const sini = Math.sin(xinc);
        const cosi = Math.cos(xinc);
        const xmx = -snod * cosi;
        const xmy = cnod * cosi;
        const ux = xmx * sinsu + cnod * cossu;
        const uy = xmy * sinsu + snod * cossu;
        const uz = sini * sinsu;
        const vx = xmx * cossu - cnod * sinsu;
        const vy = xmy * cossu - snod * sinsu;
        const vz = sini * cossu;
        // --------- position and velocity (in km and km/sec) ----------
        const r = {
            x: mrt * ux * constants_js_7.earthRadius,
            y: mrt * uy * constants_js_7.earthRadius,
            z: mrt * uz * constants_js_7.earthRadius,
        };
        const v = {
            x: (mvt * ux + rvdot * vx) * constants_js_7.vkmpersec,
            y: (mvt * uy + rvdot * vy) * constants_js_7.vkmpersec,
            z: (mvt * uz + rvdot * vz) * constants_js_7.vkmpersec,
        };
        return {
            position: r,
            velocity: v,
            meanElements,
        };
    }
});
define("propagation/sgp4init", ["require", "exports", "constants", "propagation/dpper", "propagation/dscom", "propagation/dsinit", "propagation/initl", "propagation/sgp4"], function (require, exports, constants_js_8, dpper_js_2, dscom_js_1, dsinit_js_1, initl_js_1, sgp4_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sgp4init = sgp4init;
    /*-----------------------------------------------------------------------------
     *
     *                             procedure sgp4init
     *
     *  this procedure initializes variables for sgp4.
     *
     *  author        : david vallado                  719-573-2600   28 jun 2005
     *  author        : david vallado                  719-573-2600   28 jun 2005
     *
     *  inputs        :
     *    opsmode     - mode of operation afspc or improved 'a', 'i'
     *    satn        - satellite number
     *    bstar       - sgp4 type drag coefficient              kg/m2er
     *    ecco        - eccentricity
     *    epoch       - epoch time in days from jan 0, 1950. 0 hr
     *    argpo       - argument of perigee (output if ds)
     *    inclo       - inclination
     *    mo          - mean anomaly (output if ds)
     *    no          - mean motion
     *    nodeo       - right ascension of ascending node
     *
     *  outputs       :
     *    rec      - common values for subsequent calls
     *    return code - non-zero on error.
     *                   1 - mean elements, ecc >= 1.0 or ecc < -0.001 or a < 0.95 er
     *                   2 - mean motion less than 0.0
     *                   3 - pert elements, ecc < 0.0  or  ecc > 1.0
     *                   4 - semi-latus rectum < 0.0
     *                   5 - epoch elements are sub-orbital
     *                   6 - satellite has decayed
     *
     *  locals        :
     *    cnodm  , snodm  , cosim  , sinim  , cosomm , sinomm
     *    cc1sq  , cc2    , cc3
     *    coef   , coef1
     *    cosio4      -
     *    day         -
     *    dndt        -
     *    em          - eccentricity
     *    emsq        - eccentricity squared
     *    eeta        -
     *    etasq       -
     *    gam         -
     *    argpm       - argument of perigee
     *    nodem       -
     *    inclm       - inclination
     *    mm          - mean anomaly
     *    nm          - mean motion
     *    perige      - perigee
     *    pinvsq      -
     *    psisq       -
     *    qzms24      -
     *    rtemsq      -
     *    s1, s2, s3, s4, s5, s6, s7          -
     *    sfour       -
     *    ss1, ss2, ss3, ss4, ss5, ss6, ss7         -
     *    sz1, sz2, sz3
     *    sz11, sz12, sz13, sz21, sz22, sz23, sz31, sz32, sz33        -
     *    tc          -
     *    temp        -
     *    temp1, temp2, temp3       -
     *    tsi         -
     *    xpidot      -
     *    xhdot1      -
     *    z1, z2, z3          -
     *    z11, z12, z13, z21, z22, z23, z31, z32, z33         -
     *
     *  coupling      :
     *    getgravconst-
     *    initl       -
     *    dscom       -
     *    dpper       -
     *    dsinit      -
     *    sgp4        -
     *
     *  references    :
     *    hoots, roehrich, norad spacetrack report #3 1980
     *    hoots, norad spacetrack report #6 1986
     *    hoots, schumacher and glover 2004
     *    vallado, crawford, hujsak, kelso  2006
     ----------------------------------------------------------------------------*/
    function sgp4init(satrecInit, options) {
        const { opsmode, satn, epoch, xbstar, xecco, xargpo, xinclo, xmo, xno, xnodeo, } = options;
        let cosim;
        let sinim;
        let cc1sq;
        let cc2;
        let cc3;
        let coef;
        let coef1;
        let cosio4;
        let em;
        let emsq;
        let eeta;
        let etasq;
        let argpm;
        let nodem;
        let inclm;
        let mm;
        let nm;
        let perige;
        let pinvsq;
        let psisq;
        let qzms24;
        let s1;
        let s2;
        let s3;
        let s4;
        let s5;
        let sfour;
        let ss1;
        let ss2;
        let ss3;
        let ss4;
        let ss5;
        let sz1;
        let sz3;
        let sz11;
        let sz13;
        let sz21;
        let sz23;
        let sz31;
        let sz33;
        let tc;
        let temp;
        let temp1;
        let temp2;
        let temp3;
        let tsi;
        let xpidot;
        let xhdot1;
        let z1;
        let z3;
        let z11;
        let z13;
        let z21;
        let z23;
        let z31;
        let z33;
        /* ------------------------ initialization --------------------- */
        // sgp4fix divisor for divide by zero check on inclination
        // the old check used 1.0 + Math.cos(pi-1.0e-9), but then compared it to
        // 1.5 e-12, so the threshold was changed to 1.5e-12 for consistency
        const temp4 = 1.5e-12;
        const satrec = satrecInit;
        // ----------- set all near earth variables to zero ------------
        satrec.isimp = 0;
        satrec.method = 'n';
        satrec.aycof = 0.0;
        satrec.con41 = 0.0;
        satrec.cc1 = 0.0;
        satrec.cc4 = 0.0;
        satrec.cc5 = 0.0;
        satrec.d2 = 0.0;
        satrec.d3 = 0.0;
        satrec.d4 = 0.0;
        satrec.delmo = 0.0;
        satrec.eta = 0.0;
        satrec.argpdot = 0.0;
        satrec.omgcof = 0.0;
        satrec.sinmao = 0.0;
        satrec.t = 0.0;
        satrec.t2cof = 0.0;
        satrec.t3cof = 0.0;
        satrec.t4cof = 0.0;
        satrec.t5cof = 0.0;
        satrec.x1mth2 = 0.0;
        satrec.x7thm1 = 0.0;
        satrec.mdot = 0.0;
        satrec.nodedot = 0.0;
        satrec.xlcof = 0.0;
        satrec.xmcof = 0.0;
        satrec.nodecf = 0.0;
        // ----------- set all deep space variables to zero ------------
        satrec.irez = 0;
        satrec.d2201 = 0.0;
        satrec.d2211 = 0.0;
        satrec.d3210 = 0.0;
        satrec.d3222 = 0.0;
        satrec.d4410 = 0.0;
        satrec.d4422 = 0.0;
        satrec.d5220 = 0.0;
        satrec.d5232 = 0.0;
        satrec.d5421 = 0.0;
        satrec.d5433 = 0.0;
        satrec.dedt = 0.0;
        satrec.del1 = 0.0;
        satrec.del2 = 0.0;
        satrec.del3 = 0.0;
        satrec.didt = 0.0;
        satrec.dmdt = 0.0;
        satrec.dnodt = 0.0;
        satrec.domdt = 0.0;
        satrec.e3 = 0.0;
        satrec.ee2 = 0.0;
        satrec.peo = 0.0;
        satrec.pgho = 0.0;
        satrec.pho = 0.0;
        satrec.pinco = 0.0;
        satrec.plo = 0.0;
        satrec.se2 = 0.0;
        satrec.se3 = 0.0;
        satrec.sgh2 = 0.0;
        satrec.sgh3 = 0.0;
        satrec.sgh4 = 0.0;
        satrec.sh2 = 0.0;
        satrec.sh3 = 0.0;
        satrec.si2 = 0.0;
        satrec.si3 = 0.0;
        satrec.sl2 = 0.0;
        satrec.sl3 = 0.0;
        satrec.sl4 = 0.0;
        satrec.gsto = 0.0;
        satrec.xfact = 0.0;
        satrec.xgh2 = 0.0;
        satrec.xgh3 = 0.0;
        satrec.xgh4 = 0.0;
        satrec.xh2 = 0.0;
        satrec.xh3 = 0.0;
        satrec.xi2 = 0.0;
        satrec.xi3 = 0.0;
        satrec.xl2 = 0.0;
        satrec.xl3 = 0.0;
        satrec.xl4 = 0.0;
        satrec.xlamo = 0.0;
        satrec.zmol = 0.0;
        satrec.zmos = 0.0;
        satrec.atime = 0.0;
        satrec.xli = 0.0;
        satrec.xni = 0.0;
        // sgp4fix - note the following variables are also passed directly via satrec.
        // it is possible to streamline the sgp4init call by deleting the "x"
        // variables, but the user would need to set the satrec.* values first. we
        // include the additional assignments in case twoline2rv is not used.
        satrec.bstar = xbstar;
        satrec.ecco = xecco;
        satrec.argpo = xargpo;
        satrec.inclo = xinclo;
        satrec.mo = xmo;
        satrec.no = xno;
        satrec.nokozai = xno;
        satrec.nodeo = xnodeo;
        //  sgp4fix add opsmode
        satrec.operationmode = opsmode;
        // ------------------------ earth constants -----------------------
        // sgp4fix identify constants and allow alternate values
        const ss = 78.0 / constants_js_8.earthRadius + 1.0;
        // sgp4fix use multiply for speed instead of pow
        const qzms2ttemp = (120.0 - 78.0) / constants_js_8.earthRadius;
        const qzms2t = qzms2ttemp * qzms2ttemp * qzms2ttemp * qzms2ttemp;
        satrec.init = 'y';
        satrec.t = 0.0;
        const initlOptions = {
            satn,
            ecco: satrec.ecco,
            epoch,
            inclo: satrec.inclo,
            no: satrec.no,
            method: satrec.method,
            opsmode: satrec.operationmode,
        };
        const initlResult = (0, initl_js_1.initl)(initlOptions);
        const { ao, con42, cosio, cosio2, eccsq, omeosq, posq, rp, rteosq, sinio } = initlResult;
        satrec.no = initlResult.no;
        satrec.con41 = initlResult.con41;
        satrec.gsto = initlResult.gsto;
        satrec.a = (satrec.no * constants_js_8.tumin) ** (-2.0 / 3.0);
        satrec.alta = satrec.a * (1.0 + satrec.ecco) - 1.0;
        satrec.altp = satrec.a * (1.0 - satrec.ecco) - 1.0;
        satrec.error = 0;
        // sgp4fix remove this check as it is unnecessary
        // the mrt check in sgp4 handles decaying satellite cases even if the starting
        // condition is below the surface of te earth
        // if (rp < 1.0)
        // {
        //   printf("// *** satn%d epoch elts sub-orbital ***\n", satn);
        //   satrec.error = 5;
        // }
        if (omeosq >= 0.0 || satrec.no >= 0.0) {
            satrec.isimp = 0;
            if (rp < 220.0 / constants_js_8.earthRadius + 1.0) {
                satrec.isimp = 1;
            }
            sfour = ss;
            qzms24 = qzms2t;
            perige = (rp - 1.0) * constants_js_8.earthRadius;
            // - for perigees below 156 km, s and qoms2t are altered -
            if (perige < 156.0) {
                sfour = perige - 78.0;
                if (perige < 98.0) {
                    sfour = 20.0;
                }
                // sgp4fix use multiply for speed instead of pow
                const qzms24temp = (120.0 - sfour) / constants_js_8.earthRadius;
                qzms24 = qzms24temp * qzms24temp * qzms24temp * qzms24temp;
                sfour = sfour / constants_js_8.earthRadius + 1.0;
            }
            pinvsq = 1.0 / posq;
            tsi = 1.0 / (ao - sfour);
            satrec.eta = ao * satrec.ecco * tsi;
            etasq = satrec.eta * satrec.eta;
            eeta = satrec.ecco * satrec.eta;
            psisq = Math.abs(1.0 - etasq);
            coef = qzms24 * tsi ** 4.0;
            coef1 = coef / psisq ** 3.5;
            cc2 =
                coef1 *
                    satrec.no *
                    (ao * (1.0 + 1.5 * etasq + eeta * (4.0 + etasq)) +
                        ((0.375 * constants_js_8.j2 * tsi) / psisq) *
                            satrec.con41 *
                            (8.0 + 3.0 * etasq * (8.0 + etasq)));
            satrec.cc1 = satrec.bstar * cc2;
            cc3 = 0.0;
            if (satrec.ecco > 1.0e-4) {
                cc3 = (-2.0 * coef * tsi * constants_js_8.j3oj2 * satrec.no * sinio) / satrec.ecco;
            }
            satrec.x1mth2 = 1.0 - cosio2;
            satrec.cc4 =
                2.0 *
                    satrec.no *
                    coef1 *
                    ao *
                    omeosq *
                    (satrec.eta * (2.0 + 0.5 * etasq) +
                        satrec.ecco * (0.5 + 2.0 * etasq) -
                        ((constants_js_8.j2 * tsi) / (ao * psisq)) *
                            (-3.0 *
                                satrec.con41 *
                                (1.0 - 2.0 * eeta + etasq * (1.5 - 0.5 * eeta)) +
                                0.75 *
                                    satrec.x1mth2 *
                                    (2.0 * etasq - eeta * (1.0 + etasq)) *
                                    Math.cos(2.0 * satrec.argpo)));
            satrec.cc5 =
                2.0 * coef1 * ao * omeosq * (1.0 + 2.75 * (etasq + eeta) + eeta * etasq);
            cosio4 = cosio2 * cosio2;
            temp1 = 1.5 * constants_js_8.j2 * pinvsq * satrec.no;
            temp2 = 0.5 * temp1 * constants_js_8.j2 * pinvsq;
            temp3 = -0.46875 * constants_js_8.j4 * pinvsq * pinvsq * satrec.no;
            satrec.mdot =
                satrec.no +
                    0.5 * temp1 * rteosq * satrec.con41 +
                    0.0625 * temp2 * rteosq * (13.0 - 78.0 * cosio2 + 137.0 * cosio4);
            satrec.argpdot =
                -0.5 * temp1 * con42 +
                    0.0625 * temp2 * (7.0 - 114.0 * cosio2 + 395.0 * cosio4) +
                    temp3 * (3.0 - 36.0 * cosio2 + 49.0 * cosio4);
            xhdot1 = -temp1 * cosio;
            satrec.nodedot =
                xhdot1 +
                    (0.5 * temp2 * (4.0 - 19.0 * cosio2) +
                        2.0 * temp3 * (3.0 - 7.0 * cosio2)) *
                        cosio;
            xpidot = satrec.argpdot + satrec.nodedot;
            satrec.omgcof = satrec.bstar * cc3 * Math.cos(satrec.argpo);
            satrec.xmcof = 0.0;
            if (satrec.ecco > 1.0e-4) {
                satrec.xmcof = (-constants_js_8.x2o3 * coef * satrec.bstar) / eeta;
            }
            satrec.nodecf = 3.5 * omeosq * xhdot1 * satrec.cc1;
            satrec.t2cof = 1.5 * satrec.cc1;
            // sgp4fix for divide by zero with xinco = 180 deg
            if (Math.abs(cosio + 1.0) > 1.5e-12) {
                satrec.xlcof =
                    (-0.25 * constants_js_8.j3oj2 * sinio * (3.0 + 5.0 * cosio)) / (1.0 + cosio);
            }
            else {
                satrec.xlcof = (-0.25 * constants_js_8.j3oj2 * sinio * (3.0 + 5.0 * cosio)) / temp4;
            }
            satrec.aycof = -0.5 * constants_js_8.j3oj2 * sinio;
            // sgp4fix use multiply for speed instead of pow
            const delmotemp = 1.0 + satrec.eta * Math.cos(satrec.mo);
            satrec.delmo = delmotemp * delmotemp * delmotemp;
            satrec.sinmao = Math.sin(satrec.mo);
            satrec.x7thm1 = 7.0 * cosio2 - 1.0;
            // --------------- deep space initialization -------------
            if ((2 * constants_js_8.pi) / satrec.no >= 225.0) {
                satrec.method = 'd';
                satrec.isimp = 1;
                tc = 0.0;
                inclm = satrec.inclo;
                const dscomOptions = {
                    epoch,
                    ep: satrec.ecco,
                    argpp: satrec.argpo,
                    tc,
                    inclp: satrec.inclo,
                    nodep: satrec.nodeo,
                    np: satrec.no,
                    e3: satrec.e3,
                    ee2: satrec.ee2,
                    peo: satrec.peo,
                    pgho: satrec.pgho,
                    pho: satrec.pho,
                    pinco: satrec.pinco,
                    plo: satrec.plo,
                    se2: satrec.se2,
                    se3: satrec.se3,
                    sgh2: satrec.sgh2,
                    sgh3: satrec.sgh3,
                    sgh4: satrec.sgh4,
                    sh2: satrec.sh2,
                    sh3: satrec.sh3,
                    si2: satrec.si2,
                    si3: satrec.si3,
                    sl2: satrec.sl2,
                    sl3: satrec.sl3,
                    sl4: satrec.sl4,
                    xgh2: satrec.xgh2,
                    xgh3: satrec.xgh3,
                    xgh4: satrec.xgh4,
                    xh2: satrec.xh2,
                    xh3: satrec.xh3,
                    xi2: satrec.xi2,
                    xi3: satrec.xi3,
                    xl2: satrec.xl2,
                    xl3: satrec.xl3,
                    xl4: satrec.xl4,
                    zmol: satrec.zmol,
                    zmos: satrec.zmos,
                };
                const dscomResult = (0, dscom_js_1.dscom)(dscomOptions);
                satrec.e3 = dscomResult.e3;
                satrec.ee2 = dscomResult.ee2;
                satrec.peo = dscomResult.peo;
                satrec.pgho = dscomResult.pgho;
                satrec.pho = dscomResult.pho;
                satrec.pinco = dscomResult.pinco;
                satrec.plo = dscomResult.plo;
                satrec.se2 = dscomResult.se2;
                satrec.se3 = dscomResult.se3;
                satrec.sgh2 = dscomResult.sgh2;
                satrec.sgh3 = dscomResult.sgh3;
                satrec.sgh4 = dscomResult.sgh4;
                satrec.sh2 = dscomResult.sh2;
                satrec.sh3 = dscomResult.sh3;
                satrec.si2 = dscomResult.si2;
                satrec.si3 = dscomResult.si3;
                satrec.sl2 = dscomResult.sl2;
                satrec.sl3 = dscomResult.sl3;
                satrec.sl4 = dscomResult.sl4;
                ({
                    sinim,
                    cosim,
                    em,
                    emsq,
                    s1,
                    s2,
                    s3,
                    s4,
                    s5,
                    ss1,
                    ss2,
                    ss3,
                    ss4,
                    ss5,
                    sz1,
                    sz3,
                    sz11,
                    sz13,
                    sz21,
                    sz23,
                    sz31,
                    sz33,
                } = dscomResult);
                satrec.xgh2 = dscomResult.xgh2;
                satrec.xgh3 = dscomResult.xgh3;
                satrec.xgh4 = dscomResult.xgh4;
                satrec.xh2 = dscomResult.xh2;
                satrec.xh3 = dscomResult.xh3;
                satrec.xi2 = dscomResult.xi2;
                satrec.xi3 = dscomResult.xi3;
                satrec.xl2 = dscomResult.xl2;
                satrec.xl3 = dscomResult.xl3;
                satrec.xl4 = dscomResult.xl4;
                satrec.zmol = dscomResult.zmol;
                satrec.zmos = dscomResult.zmos;
                ({ nm, z1, z3, z11, z13, z21, z23, z31, z33 } = dscomResult);
                const dpperOptions = {
                    inclo: inclm,
                    init: satrec.init,
                    ep: satrec.ecco,
                    inclp: satrec.inclo,
                    nodep: satrec.nodeo,
                    argpp: satrec.argpo,
                    mp: satrec.mo,
                    opsmode: satrec.operationmode,
                };
                const dpperResult = (0, dpper_js_2.dpper)(satrec, dpperOptions);
                satrec.ecco = dpperResult.ep;
                satrec.inclo = dpperResult.inclp;
                satrec.nodeo = dpperResult.nodep;
                satrec.argpo = dpperResult.argpp;
                satrec.mo = dpperResult.mp;
                argpm = 0.0;
                nodem = 0.0;
                mm = 0.0;
                const dsinitOptions = {
                    cosim,
                    emsq,
                    argpo: satrec.argpo,
                    s1: s1,
                    s2: s2,
                    s3: s3,
                    s4: s4,
                    s5: s5,
                    sinim: sinim,
                    ss1: ss1,
                    ss2: ss2,
                    ss3: ss3,
                    ss4: ss4,
                    ss5: ss5,
                    sz1: sz1,
                    sz3: sz3,
                    sz11: sz11,
                    sz13: sz13,
                    sz21: sz21,
                    sz23: sz23,
                    sz31: sz31,
                    sz33: sz33,
                    t: satrec.t,
                    tc,
                    gsto: satrec.gsto,
                    mo: satrec.mo,
                    mdot: satrec.mdot,
                    no: satrec.no,
                    nodeo: satrec.nodeo,
                    nodedot: satrec.nodedot,
                    xpidot: xpidot,
                    z1: z1,
                    z3: z3,
                    z11: z11,
                    z13: z13,
                    z21: z21,
                    z23: z23,
                    z31: z31,
                    z33: z33,
                    ecco: satrec.ecco,
                    eccsq,
                    em,
                    argpm,
                    inclm,
                    mm,
                    nm,
                    nodem,
                    irez: satrec.irez,
                    atime: satrec.atime,
                    d2201: satrec.d2201,
                    d2211: satrec.d2211,
                    d3210: satrec.d3210,
                    d3222: satrec.d3222,
                    d4410: satrec.d4410,
                    d4422: satrec.d4422,
                    d5220: satrec.d5220,
                    d5232: satrec.d5232,
                    d5421: satrec.d5421,
                    d5433: satrec.d5433,
                    dedt: satrec.dedt,
                    didt: satrec.didt,
                    dmdt: satrec.dmdt,
                    dnodt: satrec.dnodt,
                    domdt: satrec.domdt,
                    del1: satrec.del1,
                    del2: satrec.del2,
                    del3: satrec.del3,
                    xfact: satrec.xfact,
                    xlamo: satrec.xlamo,
                    xli: satrec.xli,
                    xni: satrec.xni,
                };
                const dsinitResult = (0, dsinit_js_1.dsinit)(dsinitOptions);
                satrec.irez = dsinitResult.irez;
                satrec.atime = dsinitResult.atime;
                satrec.d2201 = dsinitResult.d2201;
                satrec.d2211 = dsinitResult.d2211;
                satrec.d3210 = dsinitResult.d3210;
                satrec.d3222 = dsinitResult.d3222;
                satrec.d4410 = dsinitResult.d4410;
                satrec.d4422 = dsinitResult.d4422;
                satrec.d5220 = dsinitResult.d5220;
                satrec.d5232 = dsinitResult.d5232;
                satrec.d5421 = dsinitResult.d5421;
                satrec.d5433 = dsinitResult.d5433;
                satrec.dedt = dsinitResult.dedt;
                satrec.didt = dsinitResult.didt;
                satrec.dmdt = dsinitResult.dmdt;
                satrec.dnodt = dsinitResult.dnodt;
                satrec.domdt = dsinitResult.domdt;
                satrec.del1 = dsinitResult.del1;
                satrec.del2 = dsinitResult.del2;
                satrec.del3 = dsinitResult.del3;
                satrec.xfact = dsinitResult.xfact;
                satrec.xlamo = dsinitResult.xlamo;
                satrec.xli = dsinitResult.xli;
                satrec.xni = dsinitResult.xni;
            }
            // ----------- set variables if not deep space -----------
            if (satrec.isimp !== 1) {
                cc1sq = satrec.cc1 * satrec.cc1;
                satrec.d2 = 4.0 * ao * tsi * cc1sq;
                temp = (satrec.d2 * tsi * satrec.cc1) / 3.0;
                satrec.d3 = (17.0 * ao + sfour) * temp;
                satrec.d4 =
                    0.5 * temp * ao * tsi * (221.0 * ao + 31.0 * sfour) * satrec.cc1;
                satrec.t3cof = satrec.d2 + 2.0 * cc1sq;
                satrec.t4cof =
                    0.25 *
                        (3.0 * satrec.d3 + satrec.cc1 * (12.0 * satrec.d2 + 10.0 * cc1sq));
                satrec.t5cof =
                    0.2 *
                        (3.0 * satrec.d4 +
                            12.0 * satrec.cc1 * satrec.d3 +
                            6.0 * satrec.d2 * satrec.d2 +
                            15.0 * cc1sq * (2.0 * satrec.d2 + cc1sq));
            }
            /* finally propogate to zero epoch to initialize all others. */
            // sgp4fix take out check to let satellites process until they are actually below earth surface
            // if(satrec.error == 0)
        }
        (0, sgp4_js_1.sgp4)(satrec, 0);
        satrec.init = 'n';
    }
});
define("io", ["require", "exports", "constants", "ext", "propagation/sgp4init"], function (require, exports, constants_js_9, ext_js_2, sgp4init_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.twoline2satrec = twoline2satrec;
    exports.json2satrec = json2satrec;
    exports.alpha5ToNumber = alpha5ToNumber;
    function initSatrec(satrec, opsmode) {
        (0, sgp4init_js_1.sgp4init)(satrec, {
            opsmode,
            satn: satrec.satnum,
            epoch: satrec.jdsatepoch - 2433281.5,
            xbstar: satrec.bstar,
            xecco: satrec.ecco,
            xargpo: satrec.argpo,
            xinclo: satrec.inclo,
            xmo: satrec.mo,
            xno: satrec.no,
            xnodeo: satrec.nodeo,
        });
    }
    /* -----------------------------------------------------------------------------
     *
     *                           function twoline2satrec
     *
     *  this function converts the two line element set character string data to
     *    variables and initializes the sgp4 variables. several intermediate varaibles
     *    and quantities are determined. note that the result is a structure so multiple
     *    satellites can be processed simultaneously without having to reinitialize. the
     *    verification mode is an important option that permits quick checks of any
     *    changes to the underlying technical theory. this option works using a
     *    modified tle file in which the start, stop, and delta time values are
     *    included at the end of the second line of data. this only works with the
     *    verification mode. the catalog mode simply propagates from -1440 to 1440 min
     *    from epoch and is useful when performing entire catalog runs.
     *
     *  author        : david vallado                  719-573-2600    1 mar 2001
     *
     *  inputs        :
     *    longstr1    - first line of the tle
     *    longstr2    - second line of the tle
     *    typerun     - type of run                    verification 'v', catalog 'c',
     *                                                 manual 'm'
     *    typeinput   - type of manual input           mfe 'm', epoch 'e', dayofyr 'd'
     *    opsmode     - mode of operation afspc or improved 'a', 'i'
     *    whichconst  - which set of constants to use  72, 84
     *
     *  outputs       :
     *    satrec      - structure containing all the sgp4 satellite information
     *
     *  coupling      :
     *    getgravconst-
     *    days2mdhms  - conversion of days to month, day, hour, minute, second
     *    jday        - convert day month year hour minute second into julian date
     *    sgp4init    - initialize the sgp4 variables
     *
     *  references    :
     *    norad spacetrack report #3
     *    vallado, crawford, hujsak, kelso  2006
     --------------------------------------------------------------------------- */
    /**
     * Return a Satellite imported from two lines of TLE data.
     *
     * Provide the two TLE lines as strings `tleLine1` and `tleLine2`,
     * and select which standard set of gravitational constants you want
     * by providing `gravity_constants`:
     *
     * `sgp4.propagation.wgs72` - Standard WGS 72 model
     * `sgp4.propagation.wgs84` - More recent WGS 84 model
     * `sgp4.propagation.wgs72old` - Legacy support for old SGP4 behavior
     *
     * Normally, computations are made using various recent improvements
     * to the algorithm.  If you want to turn some of these off and go
     * back into "afspc" mode, then set `afspc_mode` to `True`.
     */
    function twoline2satrec(longstr1, longstr2) {
        const opsmode = 'i';
        const error = 0;
        const satnum = longstr1.substring(2, 7);
        const epochyr = parseInt(longstr1.substring(18, 20), 10);
        const epochdays = parseFloat(longstr1.substring(20, 32));
        let ndot = parseFloat(longstr1.substring(33, 43));
        let nddot = parseFloat(`${longstr1.substring(44, 45)}.${longstr1.substring(45, 50)}E${longstr1.substring(50, 52)}`);
        const bstar = parseFloat(`${longstr1.substring(53, 54)}.${longstr1.substring(54, 59)}E${longstr1.substring(59, 61)}`);
        // satrec.satnum = longstr2.substring(2, 7);
        // ---- find standard orbital elements ----
        const inclo = parseFloat(longstr2.substring(8, 16)) * constants_js_9.deg2rad;
        const nodeo = parseFloat(longstr2.substring(17, 25)) * constants_js_9.deg2rad;
        const ecco = parseFloat(`.${longstr2.substring(26, 33).replace(/\s/g, '0')}`);
        const argpo = parseFloat(longstr2.substring(34, 42)) * constants_js_9.deg2rad;
        const mo = parseFloat(longstr2.substring(43, 51)) * constants_js_9.deg2rad;
        // ---- find no, ndot, nddot ----
        const no = parseFloat(longstr2.substring(52, 63)) / constants_js_9.xpdotp;
        // satrec.nddot= satrec.nddot * Math.pow(10.0, nexp);
        // satrec.bstar= satrec.bstar * Math.pow(10.0, ibexp);
        // ---- convert to sgp4 units ----
        ndot /= constants_js_9.xpdotp * 1440.0; // ? * minperday
        nddot /= constants_js_9.xpdotp * 1440.0 * 1440;
        // ----------------------------------------------------------------
        // find sgp4epoch time of element set
        // remember that sgp4 uses units of days from 0 jan 1950 (sgp4epoch)
        // and minutes from the epoch (time)
        // ----------------------------------------------------------------
        // ---------------- temp fix for years from 1957-2056 -------------------
        // --------- correct fix will occur when year is 4-digit in tle ---------
        const year = epochyr < 57 ? epochyr + 2000 : epochyr + 1900;
        const mdhmsResult = (0, ext_js_2.days2mdhms)(year, epochdays);
        const { mon, day, hr, minute, sec } = mdhmsResult;
        const jdsatepoch = (0, ext_js_2.jday)(year, mon, day, hr, minute, sec);
        const satrec = {
            error,
            satnum,
            epochyr,
            epochdays,
            ndot,
            nddot,
            bstar,
            inclo,
            nodeo,
            ecco,
            argpo,
            mo,
            no,
            jdsatepoch,
        };
        //  ---------------- initialize SGP4 model -------------------
        initSatrec(satrec, opsmode);
        return satrec;
    }
    /* -----------------------------------------------------------------------------
     *
     *                           function json2satrec
     *
     *  this function converts the OMM json data to variables and initializes the sgp4
     *    variables. several intermediate varaibles and quantities are determined. note
     *    that the result is a structure so multiple satellites can be processed
     *    simultaneously without having to reinitialize. the verification mode is an
     *    important option that permits quick checks of any changes to the underlying
     *    technical theory. this option works using a modified tle file in which the
     *    start, stop, and delta time values are included at the end of the second line
     *    of data. this only works with the verification mode. the catalog mode simply
     *    propagates from -1440 to 1440 min from epoch and is useful when performing
     *    entire catalog runs.
     *
     *  author        : Hariharan Vitaladevuni                   18 Aug 2023
     *                  Theodore Kruczek                         19 Aug 2023
     *
     *  inputs        :
     *    jsonobj     - OMM json data
     *    opsmode     - mode of operation afspc or improved 'a', 'i'. Default: 'i'.
     *
     *  outputs       :
     *    satrec      - structure containing all the sgp4 satellite information
     *
     *  coupling      :
     *    days2mdhms  - conversion of days to month, day, hour, minute, second
     *    jday        - convert day month year hour minute second into julian date
     *    sgp4init    - initialize the sgp4 variables
     *
     *  warning       : the epoch date in OMM format is more accurate than TLE format!
     *                  this will result in extremely close, but different
     *                  position/velocity values. Depending on your use case, it may
     *                  be better to use twoline2satrec, but for the average user this
     *                  will provide comparable results.
     *
     *  references    :
     *    https://celestrak.org/NORAD/documentation/gp-data-formats.php
     --------------------------------------------------------------------------- */
    function json2satrec(jsonobj, opsmode = 'i') {
        const error = 0;
        const satnum = jsonobj.NORAD_CAT_ID.toString();
        const epochStr = jsonobj.EPOCH.endsWith('Z')
            ? jsonobj.EPOCH
            : `${jsonobj.EPOCH}Z`;
        const epoch = new Date(epochStr);
        // Date keeps milliseconds only; CelesTrak and Space-Track write microseconds, so keep the rest of the fraction
        const fractionDigits = /\.(\d+)Z$/.exec(epochStr)?.[1] ?? '';
        const beyondMs = fractionDigits.length > 3
            ? Number(`0.${fractionDigits.slice(3)}`) / 1000
            : 0; // seconds beyond the milliseconds
        const year = epoch.getUTCFullYear();
        const epochyr = Number(year.toString().slice(-2));
        const epochdays = (epoch.valueOf() - new Date(Date.UTC(year, 0, 1, 0, 0, 0)).valueOf()) /
            (86400 * 1000) +
            beyondMs / 86400 +
            1;
        let ndot = Number(jsonobj.MEAN_MOTION_DOT);
        let nddot = Number(jsonobj.MEAN_MOTION_DDOT);
        // ---- convert to sgp4 units ----
        ndot /= constants_js_9.xpdotp * 1440.0; // ? * minperday
        nddot /= constants_js_9.xpdotp * 1440.0 * 1440;
        const bstar = Number(jsonobj.BSTAR);
        const inclo = Number(jsonobj.INCLINATION) * constants_js_9.deg2rad;
        const nodeo = Number(jsonobj.RA_OF_ASC_NODE) * constants_js_9.deg2rad;
        const ecco = Number(jsonobj.ECCENTRICITY);
        const argpo = Number(jsonobj.ARG_OF_PERICENTER) * constants_js_9.deg2rad;
        const mo = Number(jsonobj.MEAN_ANOMALY) * constants_js_9.deg2rad;
        const no = Number(jsonobj.MEAN_MOTION) / constants_js_9.xpdotp;
        // ----------------------------------------------------------------
        // find sgp4epoch time of element set
        // remember that sgp4 uses units of days from 0 jan 1950 (sgp4epoch)
        // and minutes from the epoch (time)
        // ----------------------------------------------------------------
        const mdhmsResult = (0, ext_js_2.days2mdhms)(year, epochdays);
        const { mon, day, hr, minute, sec } = mdhmsResult;
        const jdsatepoch = (0, ext_js_2.jday)(year, mon, day, hr, minute, sec);
        const satrec = {
            error,
            satnum,
            epochyr,
            epochdays,
            ndot,
            nddot,
            bstar,
            inclo,
            nodeo,
            ecco,
            argpo,
            mo,
            no,
            jdsatepoch,
        };
        //  ---------------- initialize SGP4 model -------------------
        initSatrec(satrec, opsmode);
        return satrec;
    }
    /**
     * Converts a TLE catalog number field to a number, decoding the Alpha-5 form.
     *
     * Catalog numbers above 99999 are written in a TLE's five-character field as
     * Alpha-5: a leading letter A-Z, skipping I and O, stands for 10-33 in the
     * ten-thousands place, so `'A0000'` is 100000 and `'Z9999'` is 339999.
     *
     * A blank or whitespace-only field gives `NaN`, not the 0 that `Number()`
     * would return for it. Any other field goes through `Number()`: a five-digit
     * field gives its number, and so does anything else `Number()` accepts, such
     * as a space-padded `'    5'` (5) or `'1e3'` (1000); a field starting with I
     * or O, or a malformed one such as `'a0404'`, `'A000'` or `'AA000'`, gives
     * `NaN`.
     *
     * `twoline2satrec` keeps the field as written in `satrec.satnum`; this function
     * does not change that, it only converts a field when the caller wants a number.
     */
    function alpha5ToNumber(field) {
        if (field.trim() === '')
            return Number.NaN;
        const c = field[0];
        if (c !== undefined &&
            c >= 'A' &&
            c <= 'Z' &&
            c !== 'I' &&
            c !== 'O' &&
            /^\d{4}$/.test(field.slice(1))) {
            let tens = c.charCodeAt(0) - 65 + 10;
            if (c > 'I')
                tens -= 1;
            if (c > 'O')
                tens -= 1;
            return tens * 10000 + Number(field.slice(1));
        }
        return Number(field);
    }
});
define("propagation/check-for-decay", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.checkForDecay = void 0;
    // This check is authored by Theodore Kruczek for his library OOTK:
    // https://github.com/thkruz/ootk
    // Used with permission: https://github.com/thkruz/ootk/issues/31#issuecomment-4893495872
    /**
     * In some cases, usually for objects decayed long time ago,
     * SGP4 would return garbage position and speed data instead of indicating that
     * the satellite has actually decayed. This check indicates if it's one of those cases.
     *
     * Note: this community check DOES NOT EXIST in the original SGP4 algorithm, so your results
     * MAY DIFFER from the results of official SGP4 propagation when using this check.
     *
     * @returns `true` if the satellite is authoritatively decayed as a result of latest propagation call.
     * If the latest propagation call gave a non-null result, that result should be discarded.
     *
     * @example
     * ```ts
     *   const result = sgp4(satrec, 0);
     *   if (result && checkForDecay(satrec)) {
     *     // here SGP4 model reported successful propagation,
     *     //but the check caught that the satellite has decayed.
     *   }
     * ```
     *
     * @example
     * ```ts
     *   const result = propagate(satrec, new Date(), { communityDecayCheckEnabled: true })
     *   // result is non-null only if `checkForDecay` too indicates that the satellite HAS NOT decayed.
     * ```
     */
    const checkForDecay = (satrec) => satrec.tempa <= 0;
    exports.checkForDecay = checkForDecay;
});
define("propagation/propagate", ["require", "exports", "constants", "ext", "propagation/check-for-decay", "propagation/SatRec", "propagation/sgp4"], function (require, exports, constants_js_10, ext_js_3, check_for_decay_js_1, SatRec_js_2, sgp4_js_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.propagate = propagate;
    function propagate(satrec, 
    // Deliberately permissive: the overloads above define the public contract, and
    // TypeScript only requires the implementation signature to be compatible with
    // all of them.
    ...args) {
        // Return a position and velocity vector for a given date and time.
        const last = args.at(-1);
        const options = typeof last === 'object' && !(last instanceof Date) ? last : undefined;
        const jdayArgs = (options ? args.slice(0, -1) : args);
        const j = (0, ext_js_3.jday)(...jdayArgs);
        const m = (j - satrec.jdsatepoch) * constants_js_10.minutesPerDay;
        const result = (0, sgp4_js_2.sgp4)(satrec, m);
        // sgp4 sometimes propagates satellites that decayed long ago to meaningless positions
        // rather than reporting them as decayed; opting in reports them like sgp4 does.
        if (options?.communityDecayCheckEnabled && result && (0, check_for_decay_js_1.checkForDecay)(satrec)) {
            satrec.error = SatRec_js_2.SatRecError.Decayed;
            return null;
        }
        return result;
    }
});
define("propagation", ["require", "exports", "propagation/gstime", "propagation/propagate", "propagation/sgp4"], function (require, exports, gstime_js_2, propagate_js_1, sgp4_js_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sgp4 = exports.propagate = exports.gstime = void 0;
    Object.defineProperty(exports, "gstime", { enumerable: true, get: function () { return gstime_js_2.gstime; } });
    Object.defineProperty(exports, "propagate", { enumerable: true, get: function () { return propagate_js_1.propagate; } });
    Object.defineProperty(exports, "sgp4", { enumerable: true, get: function () { return sgp4_js_3.sgp4; } });
});
define("transforms", ["require", "exports", "constants"], function (require, exports, constants_js_11) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.radiansToDegrees = radiansToDegrees;
    exports.degreesToRadians = degreesToRadians;
    exports.degreesLat = degreesLat;
    exports.degreesLong = degreesLong;
    exports.radiansLat = radiansLat;
    exports.radiansLong = radiansLong;
    exports.geodeticToEcf = geodeticToEcf;
    exports.eciToGeodetic = eciToGeodetic;
    exports.ecfToEci = ecfToEci;
    exports.eciToEcf = eciToEcf;
    exports.ecfToLookAngles = ecfToLookAngles;
    function radiansToDegrees(radians) {
        return radians * constants_js_11.rad2deg;
    }
    function degreesToRadians(degrees) {
        return degrees * constants_js_11.deg2rad;
    }
    function degreesLat(radians) {
        if (radians < -constants_js_11.pi / 2 || radians > constants_js_11.pi / 2) {
            throw new RangeError('Latitude radians must be in range [-pi/2; pi/2].');
        }
        return radiansToDegrees(radians);
    }
    function degreesLong(radians) {
        if (radians < -constants_js_11.pi || radians > constants_js_11.pi) {
            throw new RangeError('Longitude radians must be in range [-pi; pi].');
        }
        return radiansToDegrees(radians);
    }
    function radiansLat(degrees) {
        if (degrees < -90 || degrees > 90) {
            throw new RangeError('Latitude degrees must be in range [-90; 90].');
        }
        return degreesToRadians(degrees);
    }
    function radiansLong(degrees) {
        if (degrees < -180 || degrees > 180) {
            throw new RangeError('Longitude degrees must be in range [-180; 180].');
        }
        return degreesToRadians(degrees);
    }
    function geodeticToEcf({ longitude, latitude, height, }) {
        const a = 6378.137;
        const b = 6356.7523142;
        const f = (a - b) / a;
        const e2 = 2 * f - f * f;
        const normal = a / Math.sqrt(1 - e2 * (Math.sin(latitude) * Math.sin(latitude)));
        const x = (normal + height) * Math.cos(latitude) * Math.cos(longitude);
        const y = (normal + height) * Math.cos(latitude) * Math.sin(longitude);
        const z = (normal * (1 - e2) + height) * Math.sin(latitude);
        return {
            x,
            y,
            z,
        };
    }
    function eciToGeodetic(eci, gmst) {
        // http://www.celestrak.com/columns/v02n03/
        const a = 6378.137;
        const b = 6356.7523142;
        const R = Math.sqrt(eci.x * eci.x + eci.y * eci.y);
        const f = (a - b) / a;
        const e2 = 2 * f - f * f;
        // the one-liner below is an alternative to the loops approach used originally:
        // let longitude = Math.atan2(eci.y, eci.x) - gmst;
        // while (longitude < -pi) {
        //   longitude += twoPi;
        // }
        // while (longitude > pi) {
        //   longitude -= twoPi;
        // }
        const longitude = ((((Math.atan2(eci.y, eci.x) - gmst + constants_js_11.pi) % constants_js_11.twoPi) + constants_js_11.twoPi) % constants_js_11.twoPi) - constants_js_11.pi;
        const kmax = 20;
        let k = 0;
        let latitude = Math.atan2(eci.z, Math.sqrt(eci.x * eci.x + eci.y * eci.y));
        let C = 0;
        while (k++ < kmax) {
            C = 1 / Math.sqrt(1 - e2 * (Math.sin(latitude) * Math.sin(latitude)));
            latitude = Math.atan2(eci.z + a * C * e2 * Math.sin(latitude), R);
        }
        const height = R / Math.cos(latitude) - a * C;
        return { longitude, latitude, height };
    }
    function ecfToEci(ecf, gmst) {
        // ccar.colorado.edu/ASEN5070/handouts/coordsys.doc
        //
        // [X]     [C -S  0][X]
        // [Y]  =  [S  C  0][Y]
        // [Z]eci  [0  0  1][Z]ecf
        //
        const X = ecf.x * Math.cos(gmst) - ecf.y * Math.sin(gmst);
        const Y = ecf.x * Math.sin(gmst) + ecf.y * Math.cos(gmst);
        const Z = ecf.z;
        return { x: X, y: Y, z: Z };
    }
    function eciToEcf(eci, gmst) {
        // ccar.colorado.edu/ASEN5070/handouts/coordsys.doc
        //
        // [X]     [C -S  0][X]
        // [Y]  =  [S  C  0][Y]
        // [Z]eci  [0  0  1][Z]ecf
        //
        //
        // Inverse:
        // [X]     [C  S  0][X]
        // [Y]  =  [-S C  0][Y]
        // [Z]ecf  [0  0  1][Z]eci
        const x = eci.x * Math.cos(gmst) + eci.y * Math.sin(gmst);
        const y = eci.x * -Math.sin(gmst) + eci.y * Math.cos(gmst);
        const { z } = eci;
        return {
            x,
            y,
            z,
        };
    }
    function topocentric(observerGeodetic, satelliteEcf) {
        // http://www.celestrak.com/columns/v02n02/
        // TS Kelso's method, except I'm using ECF frame
        // and he uses ECI.
        const { longitude, latitude } = observerGeodetic;
        const observerEcf = geodeticToEcf(observerGeodetic);
        const rx = satelliteEcf.x - observerEcf.x;
        const ry = satelliteEcf.y - observerEcf.y;
        const rz = satelliteEcf.z - observerEcf.z;
        const topS = Math.sin(latitude) * Math.cos(longitude) * rx +
            Math.sin(latitude) * Math.sin(longitude) * ry -
            Math.cos(latitude) * rz;
        const topE = -Math.sin(longitude) * rx + Math.cos(longitude) * ry;
        const topZ = Math.cos(latitude) * Math.cos(longitude) * rx +
            Math.cos(latitude) * Math.sin(longitude) * ry +
            Math.sin(latitude) * rz;
        return { topS, topE, topZ };
    }
    function topocentricToLookAngles(tc) {
        const { topS, topE, topZ } = tc;
        const rangeSat = Math.sqrt(topS * topS + topE * topE + topZ * topZ);
        const El = Math.asin(topZ / rangeSat);
        const Az = Math.atan2(-topE, topS) + constants_js_11.pi;
        return {
            azimuth: Az,
            elevation: El,
            rangeSat, // Range in km
        };
    }
    function ecfToLookAngles(observerGeodetic, satelliteEcf) {
        const topocentricCoords = topocentric(observerGeodetic, satelliteEcf);
        return topocentricToLookAngles(topocentricCoords);
    }
});
define("sun", ["require", "exports", "constants"], function (require, exports, constants_js_12) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sunPos = sunPos;
    /* Line by Line MATLAB-to-Javascript conversion of "sun.mat" from Vallado package */
    /* -----------------------------------------------------------------------------
     *
     *                              function sunPos
     *
     *  this function calculates the geocentric equatorial position vector
     *      the sun given the julian date.  this is the low precision formula and
     *      is valid for years from 1950 to 2050.  accuaracy of apparent coordinates
     *      is 0.01  degrees.  notice many of the calculations are performed in
     *      degrees, and are not changed until later.  this is due to the fact that
     *      the almanac uses degrees exclusively in their formulations.
     *
     *  author        : david vallado                  719-573-2600    1 mar 2001
     *
     *  inputs          description                       range / units
     *      jd          - julian date                       days from 4713 bc
     *
     *  outputs       :
     *      rsun        - ijk position vector of the sun    au
     *      rtasc       - right ascension                   rad
     *      decl        - declination                       rad
     *
     *  coupling      :
     *      -
     *
     *  references    :
     *      VALLADO, DAVID A. (2022) ‘Computer software in MATLAB’,
     *        in Fundamentals of astrodynamics and applications. 5th edn.
     *      Computer software in MATLAB: http://celestrak.org/software/vallado-sw.php
     *  --------------------------------------------------------------------------- */
    function sunPos(jday) {
        // -------------------------  implementation   -----------------
        // -------------------  initialize values   --------------------
        const tut1 = (jday - 2451545) / 36525;
        const meanlong = (280.46 + 36000.77 * tut1) % 360; // deg
        let meananomaly = ((357.5277233 + 35999.05034 * tut1) * constants_js_12.deg2rad) % constants_js_12.twoPi; // rad
        if (meananomaly < 0) {
            meananomaly += constants_js_12.twoPi;
        }
        const eclplong_raw = ((meanlong +
            1.914666471 * Math.sin(meananomaly) +
            0.019994643 * Math.sin(2.0 * meananomaly)) %
            360.0) *
            constants_js_12.deg2rad; // rad
        const obliquity = (23.439291 - 0.0130042 * tut1) * constants_js_12.deg2rad; // rad
        // --------- find magnitude of sun vector, and it's components ------
        const magr = 1.000140612 -
            0.016708617 * Math.cos(meananomaly) -
            0.000139589 * Math.cos(2.0 * meananomaly); // in au's
        const rsun = {
            x: magr * Math.cos(eclplong_raw),
            y: magr * Math.cos(obliquity) * Math.sin(eclplong_raw),
            z: magr * Math.sin(obliquity) * Math.sin(eclplong_raw),
        };
        const rtasc_raw = Math.atan(Math.cos(obliquity) * Math.tan(eclplong_raw));
        // --- check that rtasc is in the same quadrant as eclplong_raw ----
        let eclplong = eclplong_raw;
        if (eclplong < 0.0) {
            eclplong += constants_js_12.twoPi; // make sure it's in 0 to 2pi range
        }
        let rtasc = rtasc_raw;
        if (Math.abs(eclplong - rtasc) > constants_js_12.pi * 0.5) {
            rtasc += 0.5 * constants_js_12.pi * Math.round((eclplong - rtasc_raw) / (0.5 * constants_js_12.pi));
        }
        const decl = Math.asin(Math.sin(obliquity) * Math.sin(eclplong_raw));
        return { rsun, rtasc, decl };
    }
});
/* Original MATLAB code for Sun position from Vallado package (sun.mat)  */
/*
  function [rsun,rtasc,decl] = sun ( jd );

          twopi      =     2.0*pi;
          deg2rad    =     pi/180.0;
          show = 'n';

          % -------------------------  implementation   -----------------
          % -------------------  initialize values   --------------------
          tut1= ( jd - 2451545.0  )/ 36525.0;

          if show == 'y'
              fprintf(1,'tut1 %14.9f \n',tut1);
          end

          meanlong= 280.460  + 36000.77*tut1;
          meanlong= rem( meanlong,360.0  );  %deg

          ttdb= tut1;
          meananomaly= 357.5277233  + 35999.05034 *ttdb;
          meananomaly= rem( meananomaly*deg2rad,twopi );  %rad
          if ( meananomaly < 0.0  )
              meananomaly= twopi + meananomaly;
          end

          eclplong_raw= meanlong + 1.914666471 *sin(meananomaly) ...
                      + 0.019994643 *sin(2.0 *meananomaly); %deg
          eclplong_raw= rem( eclplong_raw,360.0  );  %deg

          obliquity= 23.439291  - 0.0130042 *ttdb;  %deg

          eclplong_raw = eclplong_raw *deg2rad;
          obliquity= obliquity *deg2rad;

          % --------- find magnitude of sun vector, )   components ------
          magr= 1.000140612  - 0.016708617 *cos( meananomaly ) ...
                                - 0.000139589 *cos( 2.0 *meananomaly );    % in au's

          rsun(1)= magr*cos( eclplong_raw );
          rsun(2)= magr*cos(obliquity)*sin(eclplong_raw);
          rsun(3)= magr*sin(obliquity)*sin(eclplong_raw);

          if show == 'y'
              fprintf(1,'meanlon %11.6f meanan %11.6f eclplon %11.6f obli %11.6f \n', ...
                      meanlong,meananomaly/deg2rad,eclplong_raw/deg2rad,obliquity/deg2rad);
              fprintf(1,'rs %11.9f %11.9f %11.9f \n',rsun);
              fprintf(1,'magr %14.7f \n',magr);
          end

          rtasc= atan( cos(obliquity)*tan(eclplong_raw) );

          % --- check that rtasc is in the same quadrant as eclplong_raw ----
          if ( eclplong_raw < 0.0  )
              eclplong_raw= eclplong_raw + twopi;    % make sure it's in 0 to 2pi range
          end
          if ( abs( eclplong_raw-rtasc ) > pi*0.5  )
              rtasc= rtasc + 0.5 *pi*round( (eclplong_raw-rtasc)/(0.5 *pi));
          end
          decl = asin( sin(obliquity)*sin(eclplong_raw) );
  */
define("core", ["require", "exports", "ext", "io", "propagation", "transforms", "sun"], function (require, exports, ext_js_4, io_js_1, propagation_js_1, transforms_js_1, sun_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sunPos = exports.ecfToLookAngles = exports.eciToEcf = exports.eciToGeodetic = exports.geodeticToEcf = exports.degreesLong = exports.degreesLat = exports.degreesToRadians = exports.radiansToDegrees = exports.gstime = exports.sgp4 = exports.propagate = exports.twoline2satrec = exports.invjday = exports.jday = void 0;
    Object.defineProperty(exports, "jday", { enumerable: true, get: function () { return ext_js_4.jday; } });
    Object.defineProperty(exports, "invjday", { enumerable: true, get: function () { return ext_js_4.invjday; } });
    Object.defineProperty(exports, "twoline2satrec", { enumerable: true, get: function () { return io_js_1.twoline2satrec; } });
    Object.defineProperty(exports, "propagate", { enumerable: true, get: function () { return propagation_js_1.propagate; } });
    Object.defineProperty(exports, "sgp4", { enumerable: true, get: function () { return propagation_js_1.sgp4; } });
    Object.defineProperty(exports, "gstime", { enumerable: true, get: function () { return propagation_js_1.gstime; } });
    Object.defineProperty(exports, "radiansToDegrees", { enumerable: true, get: function () { return transforms_js_1.radiansToDegrees; } });
    Object.defineProperty(exports, "degreesToRadians", { enumerable: true, get: function () { return transforms_js_1.degreesToRadians; } });
    Object.defineProperty(exports, "degreesLat", { enumerable: true, get: function () { return transforms_js_1.degreesLat; } });
    Object.defineProperty(exports, "degreesLong", { enumerable: true, get: function () { return transforms_js_1.degreesLong; } });
    Object.defineProperty(exports, "geodeticToEcf", { enumerable: true, get: function () { return transforms_js_1.geodeticToEcf; } });
    Object.defineProperty(exports, "eciToGeodetic", { enumerable: true, get: function () { return transforms_js_1.eciToGeodetic; } });
    Object.defineProperty(exports, "eciToEcf", { enumerable: true, get: function () { return transforms_js_1.eciToEcf; } });
    Object.defineProperty(exports, "ecfToLookAngles", { enumerable: true, get: function () { return transforms_js_1.ecfToLookAngles; } });
    Object.defineProperty(exports, "sunPos", { enumerable: true, get: function () { return sun_js_1.sunPos; } });
});
return req("core")})();
