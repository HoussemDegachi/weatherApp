const htmlElems = {
  input: document.querySelector("#city-search"),
  searchForm: document.querySelector("#search"),
  weatherDegree: document.querySelector("#weather--degree"),
  weatherInfo: document.querySelector("#weather--info"),
  note: document.querySelector("#note"),
  feelsLike: document.querySelector("#feels-like"),
  precipitation: document.querySelector("#precipitation"),
  visibility: document.querySelector("#visibility"),
  humidity: document.querySelector("#humidity"),
  hourly: document.querySelector("#hourly-forecast"),
  days: document.querySelector("#days-forecast"),
  uv: document.querySelector("#uv"),
  wind: document.querySelector("#wind"),
  gust: document.querySelector("#gust"),
  popup: document.querySelector("#popup"),
  popupText: document.querySelector("#popup-text")
};

const cities = [
  "Bangkok",
  "Paris",
  "London",
  "Dubai",
  "Singapore",
  "Kuala Lumpur",
  "New York",
  "Istanbul",
  "Tokyo",
  "Antalya",
  "Seoul",
  "Osaka",
  "Makkah",
  "Phuket",
  "Pattaya",
  "Milan",
  "Barcelona",
  "Palma de Mallorca",
  "Bali",
  "Hong Kong",
  "Tunis",
];

// try to access user's geolocation
setTimeout(start, 3600000)

function start() {
  navigator.geolocation.getCurrentPosition((location) => {
    const query = `${location.coords.latitude.toFixed(2)},${location.coords.longitude.toFixed(2)}`
    main(query)
}, () => {
    const lastCity = localStorage.getItem("lastCity")
    if (lastCity) {
      main(lastCity)
    } else {
      const randomNum = Math.floor(Math.random() * (cities.length - 1))
      const randomCity = cities[randomNum]
      main(randomCity)
    }
});
}

// search for forecast
htmlElems.searchForm.addEventListener("submit", (event) => {
  event.preventDefault()
  const query = event.target[0].value
  main(query)
})

async function main(query) {
  // get weather data
  const forecast = await getForecast(query)
  if (forecast) {
    const location = forecast.location
    const current =  forecast.current
    const forcastDays = forecast.forecast.forecastday
    removeClass("forecast-loading")
    // update forecast values with data
    htmlElems.input.value = `${location.name}, ${location.country}`
    changeValue(htmlElems.weatherDegree, `${current.temp_c}°`)
    changeValue(htmlElems.weatherInfo, current.condition.text)
    changeValue(htmlElems.feelsLike, `${current.feelslike_c}°`)
    changeValue(htmlElems.precipitation, `${current.precip_mm} mm`)
    changeValue(htmlElems.visibility, `${current.vis_km} km`)
    changeValue(htmlElems.humidity, `${current.humidity}%`)
    changeValue(htmlElems.wind, `${current.wind_kph}`)
    changeValue(htmlElems.gust, `${current.gust_kph}`)
    changeValue(htmlElems.uv, `${current.uv}`)
    updateForecast(forcastDays)
  }
}

async function getForecast(query) {
  // returns forecast from api
  const now = new Date()
  if (query !== localStorage.getItem("lastCity") || Math.abs(now - new Date(localStorage.getItem("lastUpdate"))) > 3600000) {
    const rawData = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=91af10e2bb8049e6bd9162309230512&q=${query}&days=10`)
    const data = await rawData.json()
    try {
      const location = `${data.location.lat},${data.location.lon}`
      now.setMinutes(0, 0)
      localStorage.setItem("lastCity", location)
      localStorage.setItem("lastUpdate", now)
      localStorage.setItem("lastData", JSON.stringify(data))
      return data
    } catch {
      displayPopup(data.error.message)
      return false
    }
  }
    return JSON.parse(localStorage.getItem("lastData"))
}

function updateForecast(forecast) {
  // updates forecasts to new forecast
  removeClassItems("daily-forecast")
  removeClassItems("hourly-forecast")

  let dayNum = 1;
  for (const day of forecast) {
    let date;
    if (dayNum == 1) {
      date = "Today"
    } else if (dayNum == 2) {
      date = "Tomorrow"
    } else {
      date = new Date(day.date).toString().split(" ")[0]
    }
    const onClick = () => {
      removeClassItems("hourly-forecast")
      addHours(day.hour)
    }

    addForecast(htmlElems.days, {time: date, temp: day.day.avgtemp_c, icon: day.day.condition.icon }, "daily-forecast", onClick)
    if (dayNum === 1) {
      addHours(day.hour)
    }

    dayNum++
  }
}

function addHours(day) {
  for (const hourData of day) {
    const providedDate = new Date(hourData.time)
    let hour = providedDate.getHours()
    providedDate.setHours(0)
    const currentDate = new Date()
    const currentHour = currentDate.getHours()
    currentDate.setHours(0, 0, 0, 0)
      if (providedDate.getTime() === currentDate.getTime() && currentHour <= hour) {
        if (currentHour === hour) {
          hour = "Now"
        }
        addForecast(htmlElems.hourly, {time: hour, temp: hourData.temp_c, icon: hourData.condition.icon}, "hourly-forecast")
      } else if (providedDate.getTime() !== currentDate.getTime()) {
        addForecast(htmlElems.hourly, {time: hour, temp: hourData.temp_c, icon: hourData.condition.icon}, "hourly-forecast")
      }
  }
}

function addForecast(target, value, type=null, onClick=null) {
  // add forecast to target location
  const template = `
  <h3>${value.time}</h3>
  <p class="forecast-text">${value.temp}°</p>
  <img class="forecast-img" src="${value.icon}" alt="">
  `
  const newElem = document.createElement("div")
  newElem.classList.add("forecast")
  if (value.time === "Today" || value.time === "Now") {
    newElem.classList.add("forecast-highlight")
  }

  if (type) {
    newElem.classList.add(type)
  }

  if (onClick) {
    newElem.addEventListener("click", () => {
      onClick()
      for (let item of document.querySelectorAll(".forecast-highlight.daily-forecast")) {
        item.classList.remove("forecast-highlight")
      }
      newElem.classList.add("forecast-highlight")
    }
    )
  }

  newElem.innerHTML = template
  target.append(newElem)
}

function changeValue(target, value) {
  // changes values of non itretive elems
  target.innerText = value
}

function removeClassItems(className) {
  const items = document.querySelectorAll(`.${className}`)
  for (let item of items) {
    item.remove()
  }
}

function removeClass(className) {
  const items = document.querySelectorAll(`.${className}`)
  for (let item of items) {
    item.classList.remove(className)
  }
}

function displayPopup(text) {
  htmlElems.popupText.innerText = text
  htmlElems.popup.classList.remove("hide")
  htmlElems.popup.classList.add("display")
  setTimeout(hidePopup, 5000)
}

function hidePopup() {
  const popup = htmlElems.popup;
  popup.classList.remove("display")
  popup.classList.add("hide")
}

document.querySelector("#popup-btn").addEventListener("click", hidePopup)
start()