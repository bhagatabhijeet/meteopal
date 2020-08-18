let searchHistory = [];
let searchHistoryPointer = 0;
let unit = {};

// The main object to store all required data
let dataObject = {
    id: "",
    fullname: "",
    name: "",
    iconUrl: "",
    temp: "",
    pressure: "",
    humidity: "",
    windSpeed: "",
    uv: "",
    coord: { lat: 0, lon: 0 },
    unit: "",
    url: "",
    humanreadabledate: "",
    list: [],
    reset: function () {
        this.fullname = "";
        this.id = ""
        this.name = "";
        this.iconUrl = "";
        this.temp = "";
        this.pressure = "";
        this.humidity = "";
        this.windSpeed = "";
        this.uv = "";
        this.coord.lat = 0;
        this.coord.lon = 0;
        this.unit = "";
        this.url = "";
        this.humanreadabledate = "";
        this.list = [];
    }
}

// apiName object acts like enum. This is created just to ease typing and avoid string mistakes
let apiName = {
    // used to build url for current city data
    current: "CURRENT",

    // used to build url for forecast city data with &cnt=5 (I am fetching data for only 5 days)
    forecast: "FORECAST",

    // used to build url for UVIndex for a city(using lat long)
    ultraviolet: "ULTRAVIOLET"
}


$(document).ready(function () {
    //page load animation - This play a small video on page load and fadeout in 3s
    $("#pageloadvid").fadeOut(3000);

    $("#btnLeft").hide();
    $("#btnRight").hide();

    //event handlers
    $("#searchIconButton").on("click", buildSearchData);    
    $("#btnRight").on("click", showNextSearchedItem);

    // on page load get the city from local storage and search
    let lastSearchedCity = localStorage.getItem("meteopalLastSearchCity");
    if (lastSearchedCity !== null) {
        unit = getUnit();
        fetchWeatherData(lastSearchedCity);
    }
});


// Eventhandler on click of searchButton and *** recent Searches buttons ***
function buildSearchData(e) {
    event.preventDefault();
    let sVal = $("#search").val();
    //clear search input
    $("#search").val("");

    searchCity = sVal !== "" ? sVal : $(this).data('id').replaceAll("_", ",");
    unit = getUnit();
    fetchWeatherData(searchCity)
}

// Main function to fetch all required data
function fetchWeatherData(searchCity) { // Start of fetchWeatherData
    dataObject.reset();
    let queryURL = "";

    //ajax call for current day
    $.ajax({
        url: buildUrl(apiName.current, searchCity),
        method: 'GET',
        processData: false,
        statusCode: {
            404: function () {
                noRecordsFound();
            }
        },
        success: function (data) {
            //if success store the current city data in dataObject
            storeCurrentCityData(data, this.url);

        }
    })
        // then get the full city name like 'San Francisco, CA, US. use city.list.json for the same
        .then(function (data) {
            // note this nested ajax call
            $.ajax({
                //local json file. courtesy : https://openweathermap.org/
                url: "scripts/city.list.json",
                method: 'GET',
                //on success add the full city name to the dataObject
                success: function (cityList) {
                    let cityObject = cityList.find(elment => elment.id === data.id);

                    if (cityObject.state === "") {
                        dataObject.fullname = `${cityObject.name},${cityObject.country}`;
                    }
                    else {
                        dataObject.fullname = `${cityObject.name},${cityObject.state},${cityObject.country}`;
                    }
                }
            }).then(function (cityList) {
                // this nested call is to get the Ultraviolet Index of searched city
                $.ajax({
                    url: buildUrl(apiName.ultraviolet, dataObject.fullname, dataObject.coord.lat, dataObject.coord.lon),
                    method: 'GET',
                    processData: false,
                    statusCode: {
                        404: function () {
                            noRecordsFound();
                        }
                    },
                    success: function (data) {
                        dataObject.uv = data.value;
                    }
                }).then(function () {
                    // get 5 day forcast
                    $.ajax({
                        url: buildUrl(apiName.forecast, dataObject.fullname),
                        method: 'GET',
                        processData: false,
                        statusCode: {
                            404: function () {
                                noRecordsFound();
                            }
                        },
                        success: function (data) {
                            //on success store the forecast city data in dataObject

                            data.list.forEach(element => {

                                //convert the openweather date into human readable date    
                                let dt = new Date(parseInt(element.dt) * 1000);
                                dateTimeFormat = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: '2-digit' })
                                element.humanreadabledate = dateTimeFormat.format(dt);

                                // push the array to the dataObject
                                dataObject.list.push(element);
                            });
                        }
                    })
                        // **********    At this point all data fetch is completed *************
                        // **********    now continue with UI rendering  ***********************
                        .done(function () {
                            localStorage.setItem("meteopalLastSearchCity", dataObject.fullname);
                            addToRecentSearches();
                            showCityInfo();
                            showForeCast();
                            console.log(dataObject);
                        });
                });
            });
        })
} // end of fetchWeatherData

/**
 * 
 * @param {string} api the api name to be used to build url. The values used are in apiName object
 * @param {string} searchCity the name or full name like 'Dublin,CA,us'
 * @param {string} lat the string latitude of the location. Required for UVI api
 * @param {string} lon the string longitude of the location. Required for UVI api
 * @description utility function to build url
 */
function buildUrl(api, searchCity, lat, lon) {
    // Openweather.org base url
    // courtesy : https://openweathermap.org/

    let weatherAPIBaseUrl = "https://api.openweathermap.org/data/2.5";

    //api key used to feth the data
    let apikey = '166a433c57516f51dfab1f7edaed8413';

    if (api === "CURRENT") {
        return `${weatherAPIBaseUrl}/weather?q=${searchCity}&appid=${apikey}${unit.queryString}`
    }
    if (api === "FORECAST") {
        //NOTE:- &cnt=6 is used to get data for only 6 days but we'll use index from 1-5
        return `${weatherAPIBaseUrl}/forecast/daily?q=${searchCity}&cnt=6&appid=${apikey}${unit.queryString}`
    }
    if (api === "ULTRAVIOLET") {
        //NOTE:-UVI API needs lat and lon of a location
        return `${weatherAPIBaseUrl}/uvi?lat=${lat}&lon=${lon}&appid=${apikey}`
    }

}
/**
 * @description utility function to get the value of units as specified by user
 * @returns object with 2 keys namely name and queryString 
 */
function getUnit() {
    switch ($("input[name='unitgroup']:checked").val()) {
        case "standard":
            return { name: "standard", queryString: "" };
        case "metric":
            return { name: "metric", queryString: "&units=metric" };
        case "imperial":
            return { name: "imperial", queryString: "&units=imperial" };
    }
}

// Utility function to store all data in dataObject
function storeCurrentCityData(data, url) {
    dataObject.id = data.id;
    dataObject.name = data.name;
    dataObject.temp = data.main.temp;
    dataObject.pressure = data.main.pressure;
    dataObject.humidity = data.main.humidity;
    dataObject.windSpeed = data.wind.speed;
    dataObject.url = url;
    dataObject.unit = unit.name;
    dataObject.coord.lat = data.coord.lat;
    dataObject.coord.lon = data.coord.lon;
    dataObject.iconUrl = "https://openweathermap.org/img/w/" + data.weather[0].icon + ".png";
    let dt = new Date(parseInt(data.dt) * 1000);
    dateTimeFormat = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: '2-digit' })
    dataObject.humanreadabledate = dateTimeFormat.format(dt);
}

function addToRecentSearches() {

    //add the city to array 
    let idx = searchHistory.findIndex(e => e.name === dataObject.fullname);
    if (idx === -1) {
        searchHistory.unshift({ name: dataObject.fullname, icon: dataObject.iconUrl });
    }
    else {
        searchHistory.splice(idx, 1);
        searchHistory.unshift({ name: dataObject.fullname, icon: dataObject.iconUrl });
    }

    
    //add  the seached city as button to aside. Ensure proper data-id and id attributes are given
    $("#searchHistoryNav").empty();
    searchHistory.forEach(element => {
        let idText = element.name.split(",").join("_");
        $cityBtn = $("<button>").html(`<span><img style='height:35px' src='${element.icon}'></img></span><span>${element.name}</span>`);
        $cityBtn.addClass("btn btn-primary btn-sm text-left");
        $cityBtn.attr("data-id", idText);
        $cityBtn.on("click", historySearchButtonClicked)

        let dx = $("<div>");
        dx.attr("id", "div_" + idText);
        dx.addClass("SearchHistorydiv");
        dx.append($cityBtn);
        $btnRemove = $("<button>").html('<i class="fa fa-trash"></i>').addClass("btn btn-default removebtn").attr("data-id", idText);
        $btnRemove.on("click", removeDiv)
        dx.append($btnRemove);

        dx.hide().appendTo("#searchHistoryNav").fadeIn(600);

    });
    
    // Adding the searched city as Pill button to recent searches on top
    let idText = searchHistory[0].name.split(",").join("_");
    $("#searchHistoryNavPills").empty();
    $cityBtnPill = $("<button>").html(`<span><img style='height:35px' src='${searchHistory[0].icon}'></img></span><span>${searchHistory[0].name}</span>`);
    $cityBtnPill.addClass("btn btn-primary btn-sm");
    $cityBtnPill.attr("data-id", idText);
    $cityBtnPill.attr("id", "btnPill_" + idText);
    $cityBtnPill.on("click", historySearchButtonClicked);
    $cityBtnPill.hide().prependTo("#searchHistoryNavPills").fadeIn(600);

    if (searchHistory.length > 1) {
        $("#btnRight").show();
    }
    else {
        $("#btnRight").hide();
    }
}


// Event handler called when user click on the remove/bin icon button next to the searhed city button.
function removeDiv(event) {
    event.stopPropagation();
    divid = $(this).data().id    
    $("#div_" + divid).remove();
    $("#btnPill_" + divid).remove();
    let idx = searchHistory.findIndex(e => e.name === divid.split("_").join(","))
    {
        searchHistory.splice(idx, 1);
        if (searchHistory.length < 1) {
            $("#btnRight").hide()
            $("#forecastCardsContainer").empty();
            $("#cityInfo").css("display", "none");
            return;
        }
    }
    idx++;
    if (idx >= searchHistory.length) {
        idx = 0;
    }
    unit = getUnit();
    fetchWeatherData(searchHistory[idx].name);

}

// Event handler function called when user clicks on the  button in the recent searches
function historySearchButtonClicked(event) {
    event.stopPropagation();
    divid = $(this).data().id;
    let idx = searchHistory.findIndex(e => e.name === divid.split("_").join(","));
    unit = getUnit();
    fetchWeatherData(searchHistory[idx].name);
}

//Event handler function called when user click on the right arrow button in the top recent searches bar
function showNextSearchedItem() {
    searchHistoryPointer++;

    if (searchHistoryPointer > (searchHistory.length - 1)) {
        searchHistoryPointer = 1;
    }

    $("#searchHistoryNavPills").empty();
    unit = getUnit();
    fetchWeatherData(searchHistory[searchHistoryPointer].name);
}


//function to show the City Info data in the Top row of main container
function showCityInfo() {
    $("#cityNameDateImage").html("<img src='" + dataObject.iconUrl + "'/> " + " <strong>" + dataObject.fullname + " (" + dataObject.humanreadabledate + ")</strong>");
    $("#cityTemp").html(dataObject.temp + getUnitValue("temp"));
    $("#cityWind").html(dataObject.windSpeed + getUnitValue("speed"));
    $("#cityHumidity").html(dataObject.humidity + "%");

    // ****************   DIFFERENT COLOR CODES FOR UVI ****************
    if (parseFloat(dataObject.uv) <= 2) {
        $("#cityUV").css("background-color", "green");
    }
    if (parseFloat(dataObject.uv) > 2 && parseFloat(dataObject.uv) <= 5) {
        $("#cityUV").css("background-color", "yellow");
    }
    if (parseFloat(dataObject.uv) > 5 && parseFloat(dataObject.uv) <= 7) {
        $("#cityUV").css("background-color", "orange");
    }
    if (parseFloat(dataObject.uv) > 7 && parseFloat(dataObject.uv) <= 10) {
        $("#cityUV").css("background-color", "red");
    }
    if (parseFloat(dataObject.uv) > 10) {
        $("#cityUV").css("background-color", "purple");
    }

    $("#cityUV").html(dataObject.uv)
    $("#cityInfo").css("display", "block");
}

// Utility function to get the unit strings This is to keep the code DRY and avoid repeating the following in every function.
function getUnitValue(param) {
    if (param.toUpperCase() === "SPEED") {
        if (dataObject.unit === "standard" || dataObject.unit === "metric") {
            return " meter/sec";
        }
        else {
            return " miles/hour";
        }
    }
    if (param.toUpperCase() === "TEMP") {
        if (dataObject.unit === "standard") {
            return " &deg;K";
        }
        if (dataObject.unit === "metric") {
            return " &deg;C";
        }
        if (dataObject.unit === "imperial") {
            return " &deg;F";
        }
    }
}


//function to show the forecast in the bottom row of the main container. I create bootstrap card for each day
function showForeCast() {    
    $("#forecastCardsContainer").empty();

    for (let i = 1; i < dataObject.list.length; i++) {
        let d = $("<div>");
        d.addClass("card smallcard");
        d.attr("id", "day" + i);

        let $img = $("<img>")
        $img.addClass("card-img-top");
        $img.attr("src", "https://openweathermap.org/img/w/" + dataObject.list[i].weather[0].icon + ".png");

        $cardbody = $("<div>");
        $cardbody.addClass("card-body");

        $h5 = $("<h5>");
        $h5.addClass("card-title");
        $h5.html(dataObject.list[i].humanreadabledate);

        $p1 = $("<p>");
        $p1.addClass("card-text");
        $p1.html("Temperature : " + dataObject.list[i].temp.day + getUnitValue("temp"));

        $p2 = $("<p>");
        $p2.addClass("card-text");
        $p2.html("Humidity : " + dataObject.list[i].humidity + "%");

        $p3 = $("<p>");
        $p3.addClass("card-text");
        $p3.html("Wind Speed : " + dataObject.list[i].speed + getUnitValue("speed"));

        $cardbody.append($h5, $p1, $p2, $p3);
        d.append($img, $cardbody);

        $("#forecastCardsContainer").append(d);

    }    
}

//Utility function to be shown when there are no records found.
function noRecordsFound() {
    $("#messagediv").css("display", "block");
    $("#messagediv").text("No records found");
    $("#messagediv").fadeOut(4000);
    window.console.clear();
}