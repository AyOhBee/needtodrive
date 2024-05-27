let map;
let service;
let infowindow;
let currentMarkers = [];
let currentRoute;
let currentDestination;

function initMap() {
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

            const marker = new google.maps.Marker({
                position: userLocation,
                map: map
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
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 49.0, lng: 32.0 }, // Центр України
        zoom: 6
    });

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

function toggleMarker(type) {
    clearMarkers();

    const request = {
        location: map.getCenter(),
        radius: '5000', // радіус у метрах
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
        if (currentRoute) {
            currentRoute.setMap(null); // Видалення маршруту при натисканні на новий маркер
            currentRoute = null;
            notificationDiv.innerHTML = ''; // Очищення повідомлення про відстань
        }
        infowindow = new google.maps.InfoWindow();
        infowindow.setContent(place.name);
        infowindow.open(map, this);
        currentDestination = place.geometry.location;
        calculateAndDisplayRoute(currentDestination);
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

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(request, function(result, status) {
        if (status === 'OK') {
            currentRoute = new google.maps.DirectionsRenderer({
                map: map,
                directions: result,
                suppressMarkers: true // Прибираємо точки A та B
            });

            const distance = result.routes[0].legs[0].distance.value; // Відстань у метрах

            const fuelNeeded = calculateFuelConsumption(distance); // Обчислення витрат палива

            const notificationDiv = document.getElementById('notification');
            notificationDiv.innerHTML = `<p>Відстань до обраного пункту: ${result.routes[0].legs[0].distance.text}</p>`;
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

function calculateFuelConsumption(distance) {
    const fuelConsumption = parseFloat(document.getElementById('fuelInput').value);
    return (distance / 100) * fuelConsumption; // Витрата пального, літрів
}

window.addEventListener('resize', function() {
    adjustMapSize();
});

function adjustMapSize() {
    const orientation = window.matchMedia("(orientation: portrait)").matches ? 'portrait' : 'landscape';
    const map = document.getElementById('map');
    if (orientation === 'portrait') {
        map.style.height = '50vh';
    } else {
        map.style.height = '70vh';
    }
}

adjustMapSize();
