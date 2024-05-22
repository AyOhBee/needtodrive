let map, service, infoWindow;
let markers = [];

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 0, lng: 0 }, // Замініть ці значення на значення за замовчуванням
        zoom: 12
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                map.setCenter(userLocation);
                new google.maps.Marker({
                    position: userLocation,
                    map: map
                });
                getWeather(userLocation.lat, userLocation.lng);
                service = new google.maps.places.PlacesService(map);
                infoWindow = new google.maps.InfoWindow();

                document.getElementById('find-gas-stations').addEventListener('click', () => {
                    findPlaces(userLocation, 'gas_station');
                });
                document.getElementById('find-parking').addEventListener('click', () => {
                    findPlaces(userLocation, 'parking');
                });
            },
            error => {
                handleLocationError(true, error);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        handleLocationError(false, null);
    }
}

function handleLocationError(browserHasGeolocation, error) {
    const errorMsg = browserHasGeolocation
        ? "Error: The Geolocation service failed."
        : "Error: Your browser doesn't support geolocation.";
    console.error(errorMsg);
    document.getElementById('weather-info').innerText = errorMsg;
}

async function getWeather(lat, lon) {
    const apiKey = '0a282b27221cd0e994be547d9054959a';
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        displayWeather(data);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        document.getElementById('weather-info').innerText = 'Failed to retrieve weather data. Please try again later.';
    }
}

function displayWeather(data) {
    const weatherInfo = document.getElementById('weather-info');
    weatherInfo.innerHTML = `
        <p>Місто: ${data.name}</p>
        <p>Температура: ${data.main.temp} °C</p>
        <p>Опис: ${data.weather[0].description}</p>
    `;
}

function findPlaces(location, placeType) {
    clearMarkers();
    const request = {
        location: location,
        radius: '5000',
        type: [placeType]
    };
    service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            results.forEach(place => {
                createMarker(place);
            });
        } else {
            console.error('Places request failed due to ' + status);
        }
    });
}

function createMarker(place) {
    const marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location
    });
    markers.push(marker);
    google.maps.event.addListener(marker, 'click', () => {
        infoWindow.setContent(place.name);
        infoWindow.open(map, marker);
    });
}

function clearMarkers() {
    markers.forEach(marker => {
        marker.setMap(null);
    });
    markers = [];
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();
});
