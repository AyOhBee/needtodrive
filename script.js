let map;
let service;
let infowindow;
let currentMarkers = [];
let currentType = '';
let directionsService;
let directionsRenderer;
let userMarker;
let currentRoute;

const blueMarkerIcon = {
    url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
};

function initMap() {
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true // Прибираємо точки A та B
    });

    const notificationDiv = document.getElementById('notification');

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
    const kharkivLocation = { lat: 49.9935, lng: 36.2304 }; // Координати Харкова

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

    const notificationDiv = document.getElementById('notification');
    if (browserHasGeolocation) {
        if (error.code === error.PERMISSION_DENIED) {
            notificationDiv.innerHTML = '<p>Будь ласка, увімкніть геолокацію у вашому браузері.</p>';
        } else {
            notificationDiv.innerHTML = '<p>Помилка: Не вдалося визначити місцезнаходження.</p>';
        }
    } else {
        notificationDiv.innerHTML = '<p>Помилка: Ваш браузер не підтримує геолокацію.</p>';
    }
}

function getWeather(lat, lon) {
    const apiKey = '0a282b27221cd0e994be547d9054959a';
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=uk&appid=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const weatherDiv = document.getElementById('weather');
            weatherDiv.innerHTML = `
                <h2>Погода в ${data.name}</h2>
                <p>Температура: ${data.main.temp}°C</p>
                <p>Погода: ${data.weather[0].description}</p>
                <p>Вологість: ${data.main.humidity}%</p>
                <p>Швидкість вітру: ${data.wind.speed} м/с</p>
            `;
        })
        .catch(error => {
            console.error('Помилка при отриманні даних про погоду:', error);
        });
}

function toggleMarkers(type) {
    if (currentType === type) {
        clearMarkers();
        currentType = '';
    } else {
        clearMarkers();
        currentType = type;
        findNearbyPlaces(type);
    }
}

function findNearbyPlaces(type) {
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

function createMarker(place) {
    const marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location
    });
    currentMarkers.push(marker);

    google.maps.event.addListener(marker, 'click', function() {
        infowindow = new google.maps.InfoWindow();
        infowindow.setContent(place.name);
        infowindow.open(map, this);

        if (currentRoute) {
            currentRoute.setMap(null); // Видалення попереднього маршруту
            currentRoute = null;
            const notificationDiv = document.getElementById('notification');
            notificationDiv.innerHTML = ''; // Очищення повідомлення про відстань
        } else {
            calculateAndDisplayRoute(marker.position);
        }
    });
}

function clearMarkers() {
    for (let i = 0; i < currentMarkers.length; i++) {
        currentMarkers[i].setMap(null);
    }
    currentMarkers = [];
}

function calculateAndDisplayRoute(destination) {
    const request = {
        origin: userMarker.getPosition(),
        destination: destination,
        travelMode: 'DRIVING'
    };
    directionsService.route(request, function(result, status) {
        if (status === 'OK') {
            currentRoute = new google.maps.DirectionsRenderer({
                map: map,
                directions: result,
                suppressMarkers: true // Прибираємо точки A та B
            });

            const distance = result.routes[0].legs[0].distance.text;
            const distanceValue = result.routes[0].legs[0].distance.value; // Відстань у метрах
            const fuelConsumption = parseFloat(document.getElementById('fuelConsumption').value); // Літрів на 100 км
            const fuelNeeded = (distanceValue / 1000) * (fuelConsumption / 100); // Обчислення витрат палива

            const notificationDiv = document.getElementById('notification');
            notificationDiv.innerHTML = `<p>Відстань до обраного пункту: ${distance}</p>`;
            notificationDiv.innerHTML += `<p>Ймовірна витрата палива: ${fuelNeeded.toFixed(2)} л</p>`; // Відображення витрат палива

            google.maps.event.addListener(currentRoute, 'click', function() {
                currentRoute.setMap(null); // Видалення маршруту при натисканні
                currentRoute = null;
                notificationDiv.innerHTML = ''; // Очищення повідомлення про відстань
            });
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
}
