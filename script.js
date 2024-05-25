let map;
let service;
let infowindow;
let currentMarkers = [];
let currentType = '';

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
                map: map,
                draggable: true // Додаємо можливість перетягування маркера
            });
            
            marker.addListener('dragend', function(event) {
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
        infowindow = new google.maps.InfoWindow();
        infowindow.setContent(place.name);
        infowindow.open(map, this);
    });
}

function clearMarkers() {
    for (let i = 0; i < currentMarkers.length; i++) {
        currentMarkers[i].setMap(null);
    }
    currentMarkers = [];
}
