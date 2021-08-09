import { Globe } from "../../src/og/Globe.js";
import { XYZ } from "../../src/og/layer/XYZ.js";
import { GlobusTerrain } from "../../src/og/terrain/GlobusTerrain.js";
import { LonLat } from "../../src/og/LonLat.js";
import { Vector } from "../../src/og/layer/Vector.js";
import { Entity } from "../../src/og/entity/Entity.js";
import { wgs84 } from "../../src/og/ellipsoid/wgs84.js";

var osm = new XYZ("OpenStreetMap", {
    isBaseLayer: true,
   // url: "//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    url: "//assets.msn.com/weathermapdata/1/bordermap/v1.2.8/{z}/{x}_{y}.png", 
    visibility: true,
    attribution: "Data @ OpenStreetMap contributors, ODbL"
});

//ellipsoid with earth dimensions
let ellipsoid = wgs84;

//coordinates of Bochum in lonlat
let lonlatBochum = new LonLat(7, 51.5, 0);
//coordinate above Bochum to allow a upwards direction of ray
let lonlatBochumAir = new LonLat(7, 51.5, 1000);
//coordinates of Bochum in Cartesian
let cartBochum = ellipsoid.lonLatToCartesian(lonlatBochum);
let cartBochumAir = ellipsoid.lonLatToCartesian(lonlatBochumAir);
//entity containing the Bochum ray
let entityBochum = new Entity({
    ray: {
        startPosition: cartBochum,
        endPosition: cartBochumAir,
        length: 2000000,
        startColor: "blue",
        endColor: "green",
        thickness: 5
    }
});

//coordinates of Moscow in lonlat
// let lonlatMoscow = new LonLat(37.6, 55.75, 0);    
let lonlatMoscow = new LonLat(5.73, 45.183, 1000);    
//coordinate above Moscow to allow a upwards direction of ray
let lonlatMoscowAir = new LonLat(37.6, 55.75, 1000);
//coordinates of Moscow in Cartesian
let cartMoscow = ellipsoid.lonLatToCartesian(lonlatMoscow);
let cartMoscowAir = ellipsoid.lonLatToCartesian(lonlatMoscowAir);
//entity containing the Moscow ray
let entityMoscow = new Entity({
    ray: {
        startPosition: cartMoscow,
        endPosition: cartMoscowAir,
        length: 1000000,
        startColor: "red",
        endColor: "green",
        thickness: 10
    }
});

//polygonOffsetUnits is needed to hide rays behind globe
let rayLayer = new Vector("rays", { polygonOffsetUnits: 0 });

//add entities containing the rays to the layer
rayLayer.add(entityBochum);
rayLayer.add(entityMoscow);

var globus = new Globe({
    target: "globus",
    name: "Earth",
    terrain: new GlobusTerrain(),
    layers: [osm, rayLayer],
    sun: {
        active: true
    }
});

//  加一个marker图标在指定的lonlat坐标,但是label没起生效
new Vector("Markers", {
    clampToGround: true
})
    .addTo(globus.planet)
    .add(
        new Entity({
            lonlat: [5.73, 45.183, 0],
            label: {
                text: "Hi, Globus!",
                outline: 1,
                outlineColor: "rgba(255,255,255,.4)",
                size: 60,
                color: "black",
                face: "Lucida Console",
                offset: [10, -2],
                style: "normal"
            },
            billboard: {
               // src: "./marker.png",
                src: "../../sandbox/osm/marker.png",
                width: 64,
                height: 64,
                offset: [0, 32]
            }
        })
    );

    fetch("../vectorLayer/countries.json")
    .then(r => {
        return r.json();
    }).then(data => {
        var countries = new Vector("Countries", {
            'visibility': true,
            'isBaseLayer': false,
            'diffuse': [0, 0, 0],
            'ambient': [1, 1, 1]
        });

        countries.addTo(globus.planet);

        var f = data.features;
        for (var i = 0; i < f.length; i++) {
            var fi = f[i];
            countries.add(new Entity({
                'geometry': {
                    'type': fi.geometry.type,
                    'coordinates': fi.geometry.coordinates,
                    'style': {
                        'fillColor': "rgba(255,255,255,0.6)"
                    }
                }
            }));
        }

        countries.events.on("mouseleave", function (e) {
            e.pickingObject.geometry.setFillColor(1, 1, 1, 0.6);
            e.pickingObject.geometry.setLineColor(0.2, 0.6, 0.8, 1.0);
        });
        countries.events.on("mouseenter", function (e) {
            e.pickingObject.geometry.bringToFront();
            e.pickingObject.geometry.setFillColor(1, 0, 0, 0.4);
            e.pickingObject.geometry.setLineColor(1, 0, 0, 1.0);
        });
        countries.events.on("lclick", function (e) {
            globus.planet.flyExtent(e.pickingObject.geometry.getExtent());
        });
        countries.events.on("touchstart", function (e) {
            globus.planet.flyExtent(e.pickingObject.geometry.getExtent());
        });
    });

  globus.planet.viewExtentArr([5.54, 45.141, 5.93, 45.23]);  // 初始视角

window.globus = globus;
window.entityMoscow = entityMoscow;
window.entityBochum = entityBochum;
