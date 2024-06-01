let map;
let service;
let directionsService;
let directionsRenderer;
let userMarker;
let currentRoute;
let activeMarker = null;
let activeInfoWindow = null;

const blueMarkerIcon = {
    url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
};

function startApp() {
    document.getElementById("introPage").style.display = "none";
    document.getElementById("appPage").style.display = "block";
    initMap();
}

function initMap() {
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map = new google.maps.Map(document.getElementById('map'), {
                center: userLocation,
                zoom: 10
            });

            directionsRenderer.setMap(map);

            userMarker = new google.maps.Marker({
                position: userLocation,
                map: map,
                draggable: true,
                icon: blueMarkerIcon
            });

            userMarker.addListener('dragend', function(event) {
                getWeather(event.latLng.lat(), event.latLng.lng());
            });

            getWeather(userLocation.lat, userLocation.lng);
        }, error => {
            handleLocationError(true, error);
        });
    } else {
        handleLocationError(false);
    }
}

function handleLocationError(browserHasGeolocation, error = null) {
    const kharkivLocation = { lat: 49.9935, lng: 36.2304 };

    map = new google.maps.Map(document.getElementById('map'), {
        center: kharkivLocation,
        zoom: 10
    });

    directionsRenderer.setMap(map);

    userMarker = new google.maps.Marker({
        position: kharkivLocation,
        map: map,
        draggable: true,
        icon: blueMarkerIcon
    });

    userMarker.addListener('dragend', function(event) {
        getWeather(event.latLng.lat(), event.latLng.lng());
    });

    getWeather(kharkivLocation.lat, kharkivLocation.lng);

    const errorDiv = document.getElementById('error');
    if (browserHasGeolocation) {
        if (error.code === error.PERMISSION_DENIED) {
            errorDiv.innerHTML = 'Будь ласка, увімкніть геолокацію у вашому браузері.';
        } else {
            errorDiv.innerHTML = 'Помилка: Не вдалося визначити місцезнаходження.';
        }
    } else {
        errorDiv.innerHTML = 'Помилка: Ваш браузер не підтримує геолокацію.';
    }
}

function getWeather(lat, lon) {
    const apiKey = '0a282b27221cd0e994be547d9054959a';
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=ua`)
        .then(response => response.json())
        .then(data => {
            const weatherDiv = document.getElementById('weather');
            const weatherHTML = `
                <h2>Погода</h2>
                <p>Температура: ${data.main.temp}°C</p>
                <p>Погода: ${data.weather[0].description}</p>
                <p>Вологість: ${data.main.humidity}%</p>
                <p>Швидкість вітру: ${data.wind.speed} м/с</p>
            `;
            weatherDiv.innerHTML = weatherHTML;
        })
        .catch(error => console.error('Error fetching weather data:', error));
}

function toggleMarkers(type) {
    if (currentType === type) {
        clearMarkers();
        currentType = '';
    } else {
        clearMarkers();
        currentType = type;
        const request = {
            location: map.getCenter(),
            radius: '5000',
            type: [type]
        };
        service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                for (let i = 0; i < results.length; i++) {
                    createMarker(results[i]);
                }
            }
        });
    }
}

function createMarker(place) {
    const marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        title: place.name
    });

    google.maps.event.addListener(marker, 'click', () => {
        if (activeMarker) {
            activeMarker.setAnimation(null);
        }
        if (activeInfoWindow) {
            activeInfoWindow.close();
        }
        marker.setAnimation(google.maps.Animation.BOUNCE);
        activeMarker = marker;

        const infoWindow = new google.maps.InfoWindow({
            content: `<h3>${place.name}</h3><p>${place.vicinity}</p>`
        });
        infoWindow.open(map, marker);
        activeInfoWindow = infoWindow;
        calculateAndDisplayRoute(marker.getPosition());
    });

    currentMarkers.push(marker);
}

function clearMarkers() {
    for (let i = 0; i < currentMarkers.length; i++) {
        currentMarkers[i].setMap(null);
    }
    currentMarkers = [];
    if (activeInfoWindow) {
        activeInfoWindow.close();
    }
}

function calculateAndDisplayRoute(destination) {
    if (userMarker && userMarker.getPosition()) {
        const request = {
            origin: userMarker.getPosition(),
            destination: destination,
            travelMode: google.maps.TravelMode.DRIVING
        };
        directionsService.route(request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(result);
                currentRoute = result;
                updateFuelConsumption();
            } else {
                console.error('Directions request failed due to ' + status);
            }
        });
    }
}

function updateFuelConsumption() {
    if (currentRoute) {
        const fuelConsumption = document.getElementById('fuelInput').value;
        const distance = currentRoute.routes[0].legs[0].distance.value / 1000; // distance in km
        const fuelUsed = (fuelConsumption * distance) / 100;
        const fuelResultDiv = document.getElementById('fuelConsumptionResult');
        fuelResultDiv.textContent = `Ви використаєте приблизно ${fuelUsed.toFixed(2)} літрів палива на цей маршрут.`;
    }
}
