goog.provide('og.orbit');

goog.require('og.math');
goog.require('og.math.Matrix3');

og.orbit.getEccentricAnomaly = function (M, ecc) {
    if (ecc == 0.0) {
        // Circular orbit
        return M;
    } else if (ecc < 0.2) {
        // Low eccentricity, so use the standard iteration technique
        return og.math.solve_iteration_fixed(og.orbit.SolveKeplerFunc1(ecc, M), M, 5);
    } else if (ecc < 0.9) {
        // Higher eccentricity elliptical orbit; use a more complex but
        // much faster converging iteration.
        return og.math.solve_iteration_fixed(og.orbit.SolveKeplerFunc2(ecc, M), M, 6);
    } else if (ecc < 1.0) {
        // Extremely stable Laguerre-Conway method for solving Kepler's
        // equation.  Only use this for high-eccentricity orbits, as it
        // requires more calcuation.
        var E = M + 0.85 * ecc * sign(sin(M));
        return og.math.solve_iteration_fixed(og.orbit.SolveKeplerLaguerreConway(ecc, M), E, 8);
    } else if (ecc == 1.0) {
        //TODO: Parabolic orbit
        return M;
    } else {
        // Laguerre-Conway method for hyperbolic (ecc > 1) orbits.
        var E = log(2 * M / ecc + 1.85);
        return og.math.solve_iteration_fixed(og.orbit.SolveKeplerLaguerreConwayHyp(ecc, M), E, 30);
    }
};

// Standard iteration for solving Kepler's Equation
og.orbit.SolveKeplerFunc1 = function (ecc, M) {
    return function (x) {
        return M + ecc * Math.sin(x);
    }
};

// Faster converging iteration for Kepler's Equation; more efficient
// than above for orbits with eccentricities greater than 0.3.  This
// is from Jean Meeus's _Astronomical Algorithms_ (2nd ed), p. 199
og.orbit.SolveKeplerFunc2 = function (ecc, M) {
    return function (x) {
        return x + (M + ecc * Math.sin(x) - x) / (1 - ecc * Math.cos(x));
    }
};

og.orbit.SolveKeplerLaguerreConway = function (ecc, M) {
    return function (x) {
        var s = ecc * Math.sin(x);
        var c = ecc * Math.cos(x);
        var f = x - s - M;
        var f1 = 1 - c;
        var f2 = s;
        x += -5 * f / (f1 + Math.sign(f1) * Math.sqrt(abs(16 * f1 * f1 - 20 * f * f2)));
        return x;
    }
};

og.orbit.SolveKeplerLaguerreConwayHyp = function (ecc, M) {
    return function (x) {
        var s = ecc * sinh(x);
        var c = ecc * cosh(x);
        var f = s - x - M;
        var f1 = c - 1;
        var f2 = s;
        x += -5 * f / (f1 + Math.sign(f1) * Math.sqrt(Math.abs(16 * f1 * f1 - 20 * f * f2)));
        return x;
    }
};

og.orbit.getEllipticalEccentricAnomaly = function (meanAnomaly, eccentricity) {
    var tol = 0.00000001745;
    var iterations = 20;
    var e = meanAnomaly - 2.0 * Math.PI * (meanAnomaly / (2.0 * Math.PI) | 0);
    var err = 1;
    while (Math.abs(err) > tol && iterations > 0) {
        err = e - eccentricity * Math.sin(e) - meanAnomaly;
        var delta = err / (1 - eccentricity * Math.cos(e));
        e -= delta;
        iterations--;
    }
    return e;
};

og.orbit.getTrueAnomaly = function (eccentricAnomaly, eccentricity) {
    var revs = Math.floor(eccentricAnomaly / og.math.TWO_PI);
    eccentricAnomaly -= revs * og.math.TWO_PI;
    var trueAnomaly = Math.atan2(Math.sin(eccentricAnomaly) * Math.sqrt(1 - eccentricity * eccentricity),
        Math.cos(eccentricAnomaly) - eccentricity);
    trueAnomaly = og.math.zeroTwoPI(trueAnomaly);
    if (eccentricAnomaly < 0) {
        trueAnomaly -= og.math.TWO_PI;
    }
    return trueAnomaly + revs * og.math.TWO_PI;
};

og.orbit.getPerifocalToCartesianMatrix = function (argumentOfPeriapsis, inclination, rightAscension) {
    var res = new og.math.Matrix3();
    var cosap = Math.cos(argumentOfPeriapsis),
        sinap = Math.sin(argumentOfPeriapsis),
        cosi = Math.cos(inclination),
        sini = Math.sin(inclination),
        cosraan = Math.cos(rightAscension),
        sinraan = Math.sin(rightAscension);
    res._m[0] = cosraan * cosap - sinraan * sinap * cosi;
    res._m[1] = sinraan * cosap + cosraan * sinap * cosi;
    res._m[2] = sinap * sini;
    res._m[3] = -cosraan * sinap - sinraan * cosap * cosi;
    res._m[4] = -sinraan * sinap + cosraan * cosap * cosi;
    res._m[5] = cosap * sini;
    res._m[6] = sinraan * sini;
    res._m[7] = -cosraan * sini;
    res._m[8] = cosi;
    return res;
};