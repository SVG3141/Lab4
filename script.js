/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

// Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoidmFsZGVzczAwNCIsImEiOiJjbHR4aTB1OXgwNnR4MmltaWN6dThyb256In0.wWbhlv4Owdp7kE88DIyG0A'; 

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/mapbox/light-v11',  
    center: [-79.37333, 43.74167],  // starting point, longitude/latitude
    zoom: 10 // starting zoom level
});

//Add zoom and rotation controls to the map.
map.addControl(
    new MapboxGeocoder({
        accessToken:mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        countries: "ca"

    })
);

map.addControl(new mapboxgl.NavigationControl());
map.addControl(new mapboxgl.FullscreenControl());

document.getElementById('returnbutton').addEventListener('click', () => {
    map.flyTo({
        center: [-79.37333, 43.74167],
        zoom: 10,
        essential: true
    });
});


let collisionPtsJson;

fetch('https://raw.githubusercontent.com/smith-lg/ggr472-lab4/main/data/pedcyc_collision_06-21.geojson')
    .then(response => response.json())
    .then(response => {
        collisionPtsJson = response; // Store geojson as variable using URL from fetch response
    });

map.on('load', () => {
    
    let envresult;

    let enveloped = turf.envelope(collisionPtsJson); // send point geojson to turf, creates an 'envelope' (bounding box) around points
    // put the resulting envelope in a geojson format FeatureCollection
    envresult = {
        "type": "FeatureCollection",
        "features": [enveloped]
    };  

    // add the bounding box we just created to the map
    map.addSource('envelopeGeoJSON', {
        "type": "geojson",
        "data": envresult  // use bbox geojson variable as data source
    });
     //Add datasource using GeoJSON variable
    map.addSource('collisionData', {
        type: 'geojson',
        data: collisionPtsJson
    });    

    let bboxcoords = envresult.features[0].bbox;
        var cellSide = 0.5;
        var options = {units: 'kilometers'};
        var hexGrid = turf.hexGrid(bboxcoords, cellSide, options);
          
    let collishex = turf.collect(hexGrid, collisionPtsJson, '_id', 'values');
       
    let maxcollis = 0;
    collishex.features.forEach((feature) => { //Loop through each hexagon from hex grid
        let count = 0;
        collisionPtsJson.features.forEach(point => { //Loop through each point in colection
            if (turf.booleanContains(feature, point)) { //If the point intersects with hex, acumulate counter.
                count++;
            }
        });
        feature.properties.values = count;
            if(feature.properties.values > maxcollis){ //find the largest value of accodents of all the hex features
                maxcollis = feature.properties.values
            }
        });
        
    map.addLayer({
        'id': 'colHexmap',
        'type': 'fill',
        'source': {
            'type': 'geojson',
            'data': collishex
        },
        'layout': {},
        'paint': {
            'fill-color': [
                "interpolate", ["linear"], ["get", "values"],
                0, '#088',
                maxcollis, '#BF40BF'
            ],
            'fill-opacity' : 0.8
        }
    });
    

});

map.on('click', 'collisionDataPts', (e) => {
    const acType = e.features[0].properties.INJURY;
    const coords = e.features[0].geometry.coordinates.slice();
    new mapboxgl.Popup()
        .setLngLat(coords)
        .setHTML("Injury Type: " + acType + " injury")
        .addTo(map);
});
map.on('mouseenter', 'collisionDataPts', () => {
    map.getCanvas().style.cursor = 'pointer';
});

// Change it back to a pointer when it leaves.
map.on('mouseleave', 'collisionDataPts', () => {
    map.getCanvas().style.cursor = '';
});


let legendcheck = document.getElementById('legendcheck');

legendcheck.addEventListener('click', () => {
    if (legendcheck.checked) {
        legendcheck.checked = true;
        legend.style.display = 'block';
    }
    else {
        legend.style.display = "none";
        legendcheck.checked = false;
    }
});

document.getElementById('ptcheck').addEventListener('change', (e) => {
    map.addLayer({
        'id': 'collisionDataPts',
        'type': 'circle',
        'source': 'collisionData',
        'paint': {
            'circle-radius': 4,
            'circle-color': 'Red'
        },    
    }); 

    map.setLayoutProperty(
        'collisionDataPts',
        'visibility',
        e.target.checked ? 'visible' : 'none'
    );
});

document.getElementById('bboxcheck').addEventListener('change', (e) => {
    map.addLayer({
        "id": "colEnvelope",
        "type": "fill",
        "source": "envelopeGeoJSON",
        "paint": {
            'fill-color': "red",
            'fill-opacity': 0.5,
            'fill-outline-color': "black"
        }
    });

    map.setLayoutProperty(
        'colEnvelope',
        'visibility',
        e.target.checked ? 'visible' : 'none'
    );
});

document.getElementById('hexcheck').addEventListener('change', (e) => {
    map.setLayoutProperty(
        'colHexmap',
        'visibility',
        e.target.checked ? 'visible' : 'none'
    );
});


