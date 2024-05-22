let map, service, infoWindow;
let markers = [];

document.addEventListener('DOMContentLoaded', () => {
    checkGeolocationPermission();
});

function checkGeolocationPermission() {
    if ("geolocation" in navigator) {
        navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
            if (permissionStatus.state === 'granted') {
                // Дозвіл вже отримано, можемо продовжувати з запитом геоданих
                requestGeolocation();
            } else {
                // Потрібно отримати дозвіл
                showGeolocationPermissionDialog();
            }
        });
    } else {
        // Браузер не підтримує геолокацію
        handleLocationError(false, null);
    }
}

function showGeolocationPermissionDialog() {
    // Відображаємо повідомлення про запит дозволу на геолокацію
    document.getElementById('geolocation-permission').style.display = 'block';
}

document.getElementById('allow-location').addEventListener('click', () => {
    // Після кліку на кнопку "Дозволити", викликаємо запит на геодані
    requestGeolocation();
});

function requestGeolocation() {
    navigator.geolocation.getCurrentPosition(position => {
        // Приховуємо повідомлення про дозвіл і показуємо контент
        document.getElementById('geolocation-permission').style.display = 'none';
        document.getElementById('content').style.display = 'block';

        const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        initMap(userLocation);
        getWeather(userLocation.lat, userLocation.lng);
    }, error => {
        console.error('Geolocation error: ', error);
        handleLocationError(true, error);
    }, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    });
}

// Решта коду залишається без змін
