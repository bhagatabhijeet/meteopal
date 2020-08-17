let searchHistory = [];
let searchHistoryPointer = 0;
let unit={};
// This object's clone will be used to create actual data.
let dataObject = {
    id: "",
    fullname:"",
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
    list:[]
}
// let dataObject={};
// dataObject = Object.assign(dataObject,TemplateObject);


let apiName = {
    // used to build url for current city data
    current: "CURRENT",
    // used to build url for forecast city data with &cnt=5 (I am fetching data for only 5 days)
    forecast: "FORECAST",
    // used to build url for UVIndex for a city(using lat long)
    ultraviolet: "ULTRAVIOLET" // 
}



$(document).ready(function () {
    //page load animation - This play a small video on page load and fadeout in 3s
    $("#pageloadvid").fadeOut(3000);


    $("#searchIconButton").on("click", buildSearchData);
    $("#btnLeft").on("click", showPreviousSearchedItem);
    $("#btnRight").on("click", showNextSearchedItem);
});

// var queryURL=`https://api.openweathermap.org/data/2.5/forecast/daily?q=${city}&cnt=5&appid=${apikey}`;

// // Eventhandler on click of searchButton and *** recent Searches buttons ***
function buildSearchData(e) {
    event.preventDefault();
    let sVal = $("#search").val()
    searchCity = sVal !== "" ? sVal : $(this).data('id').replace("_", ",");
    unit=getUnit();
    fetchWeatherData(searchCity)
}

// Fetch all required data
function fetchWeatherData(searchCity) {

    //Begin Fetching All Data
    // let city = $("#search").val();
    // alert(buildUrl(apiName.current,searchCity));
    // return;

    // let queryURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apikey}`;
    let queryURL = "";
    //ajax call for current day
    $.ajax({
        url: buildUrl(apiName.current, searchCity),
        method: 'GET',        
        processData:false,        
        statusCode: {
            404: function () {
                noRecordsFound();
            }
        },
        success: function (data) {
            //if success store the current city data in dataObject
            storeCurrentCityData(data,this.url);
            
        }
    }) 
    // then get the full city name like 'San Francisco, CA, US. use city.list.json for the same
    .then(function (data) {
        // buildFullCityName(data);
        $.ajax({
            url: "scripts/city.list.json",
            method: 'GET',
            // async: false,
            success: function (cityList) {
    
                let cityObject = cityList.find(elment => elment.id === data.id);
                // let cityObject = cityList[index];
                if (cityObject.state === "") {
                    dataObject.fullname = `${cityObject.name},${cityObject.country}`;
                    // returnVal= `${cityObject.name},${cityObject.country}`;
                }
                else {
                    dataObject.fullname = `${cityObject.name},${cityObject.state},${cityObject.country}`;
                    // returnVal= `${cityObject.name},${cityObject.state},${cityObject.country}`;
                }
                // console.log("build full name completed");
            }
        }).then(function(){
            // getUVI(dataObject.fullname,dataObject.coord.lat,dataObject.coord.lon);
            $.ajax({
                url: buildUrl(apiName.ultraviolet, dataObject.fullname, dataObject.coord.lat, dataObject.coord.lon),
                method: 'GET',        
                processData:false,        
                statusCode: {
                    404: function () {
                        noRecordsFound();
                    }
                },
                success: function (data) {
                    dataObject.uv=data.value;
                }
            }).then(function(){
                $.ajax({
                    url: buildUrl(apiName.forecast, dataObject.fullname),
                    method: 'GET',        
                    processData:false,        
                    statusCode: {
                        404: function () {
                            noRecordsFound();
                        }
                    },
                    success: function (data) {
                        //if success store the forecast city data in dataObject
                        // storeCurrentCityData(data,this.url)
                        data.list.forEach(element => {
                            // console.log(element.dt);
                            let dt=new Date(parseInt(element.dt)*1000);
                            dateTimeFormat = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: '2-digit' }) 
                            element.humanreadabledate=dateTimeFormat.format(dt);
                            dataObject.list.push(element);
                        });
                        // console.log(data);
                    }
                });
            });
        });
    }) 
    // then get Ultraviolet Index
    // .done(function(){
        
    //     getUVI(dataObject.fullname,dataObject.coord.lat,dataObject.coord.lon);
    //     // alert("now calling 5dayforecast")
    // })
    // then get the 5 day forecast
    // .done(function(){
    //     // alert("about to get into 5 day forecast");
    //     // console.log(dataObject);
    //     console.log("full name :" + dataObject.fullname)
    //     getFiveDayForecast(dataObject.fullname);
    // })
    .done(function(){
        console.log(dataObject);
    });
    // .then(buildFullCityName)
    //     .then(addToRecentSearches);
    // function (data, statusText, xhr) {
    //     console.log(data);
    //     console.log(statusText, xhr.status);
    //     dataObject = data;
    //     if (xhr.status === 200) {
    //         addToRecentSearches(data)

    //     }
    //     else {
    //         noRecordsFound();
    //     }
    // }).fail(function () {
    //     noRecordsFound();
    // });
    // addToRecentSearches(dataObject);
}
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
            return {name:"standard",queryString:""};
        case "metric":
            return {name:"metric",queryString:"&units=metric"};
        case "imperial":
            return {name:"imperial",queryString:"&units=imperial"};
    }
}


function storeCurrentCityData(data,url) {
    // console.log(data);
    dataObject.id = data.id;
    dataObject.name = data.name;
    dataObject.temp = data.main.temp;
    dataObject.pressure = data.main.pressure;
    dataObject.humidity = data.main.humidity;
    dataObject.windSpeed = data.wind.speed;
    dataObject.url=url;
    dataObject.unit=unit.name;
    dataObject.coord.lat=data.coord.lat;
    dataObject.coord.lon=data.coord.lon;
    dataObject.iconUrl="http://openweathermap.org/img/wn/" + data.weather[0].icon + "@2x.png";
    // dataObject.fullname=buildFullCityName(data);
    // console.log(dataObject);
    console.log("storing completed");
    // buildFullCityName(data);
}

function getUVI(searchCity,lat,lon){
    $.ajax({
        url: buildUrl(apiName.ultraviolet, searchCity, lat, lon),
        method: 'GET',        
        processData:false,        
        statusCode: {
            404: function () {
                noRecordsFound();
            }
        },
        success: function (data) {
            dataObject.uv=data.value;
        }
    });
}

function getFiveDayForecast(searchCity){
    // alert(searchCity);
    $.ajax({
        url: buildUrl(apiName.forecast, searchCity),
        method: 'GET',        
        processData:false,        
        statusCode: {
            404: function () {
                noRecordsFound();
            }
        },
        success: function (data) {
            //if success store the forecast city data in dataObject
            // storeCurrentCityData(data,this.url)
            data.list.forEach(element => {
                // console.log(element.dt);
                let dt=new Date(parseInt(element.dt)*1000);
                dateTimeFormat = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: '2-digit' }) 
                element.humanreadabledate=dateTimeFormat.format(dt);
                dataObject.list.push(element);
            });
            // console.log(data);
        }
    });
    
}

function addToRecentSearches(data) {
    //build and Add one more property named fullCityName to the object
    //makes use of *** city.list.json *** in scripts directory
    // buildFullCityName(data);
    // data = dataObject;
    // alert(data.fullname);

    //add to array
    searchHistory.unshift(data);

    //add to optionlist
    let opt = $("<Option>").text(data.fullname);
    $("#optionlist").append(opt);

    //add to aside

    $cityTemp = $("<button>").html("<span><img style='height:35px' src='http://openweathermap.org/img/wn/" + data.weather[0].icon + "@2x.png'></img></span><span>" + data.fullname + "</span>");
    $cityTemp.addClass("btn btn-primary btn-sm text-left");
    let dx = $("<div>").append($("<button>").html('<i class="fa fa-trash"></i>').addClass("btn btn-defaul"));
    dx.append($cityTemp);
    $("#searchHistoryNav").prepend(dx).show(3000);

    // $cityTemp.hide().prependTo("#searchHistoryNav").fadeIn(4000);
    // $("#searchHistoryNav").prepend($cityTemp.show(6000));

    //add to nav pills

    $("#searchHistoryNavPills").empty();
    $cityRecent = $("<button>").html("<span><img style='height:25px' src='http://openweathermap.org/img/wn/" + searchHistory[0].weather[0].icon + "@2x.png'></img></span><span>" + searchHistory[0].fullname + "</span>");
    $cityRecent.addClass("btn btn-primary btn-sm");


    $("#searchHistoryNavPills").prepend($cityRecent);
    searchHistoryPointer++;
}

function buildFullCityName(data) {

    // $.ajaxSetup({
    //     async: false
    // });
    // dataObject = data;
    let returnVal="";
    $.ajax({
        url: "scripts/city.list.json",
        method: 'GET',
        // async: false,
        success: function (cityList) {

            let cityObject = cityList.find(elment => elment.id === data.id);
            // let cityObject = cityList[index];
            if (cityObject.state === "") {
                // dataObject.fullname = `${cityObject.name},${cityObject.country}`;
                returnVal= `${cityObject.name},${cityObject.country}`;
            }
            else {
                // dataObject.fullname = `${cityObject.name},${cityObject.state},${cityObject.country}`;
                returnVal= `${cityObject.name},${cityObject.state},${cityObject.country}`;
            }
            // console.log("build full name completed");
        }
    }).then(function(){
        return returnVal;
    });
    // return dataObject;
}

function showPreviousSearchedItem() {
    if (searchHistoryPointer === searchHistory.length - 1) {
        return;
    }
    searchHistoryPointer++;
    $("#searchHistoryNavPills").empty();
    $cityRecent = $("<button>").html("<span><img style='height:25px' src='http://openweathermap.org/img/wn/" + searchHistory[searchHistoryPointer].weather[0].icon + "@2x.png'></img></span><span>" + searchHistory[searchHistoryPointer].name + "</span>");
    $cityRecent.addClass("btn btn-primary btn-sm");


    $("#searchHistoryNavPills").prepend($cityRecent).show(1000);

}
function showNextSearchedItem() {
    if (searchHistoryPointer === 0) {
        return;
    }
    searchHistoryPointer--;
    $("#searchHistoryNavPills").empty();
    $cityRecent = $("<button>").html("<span><img style='height:25px' src='http://openweathermap.org/img/wn/" + searchHistory[searchHistoryPointer].weather[0].icon + "@2x.png'></img></span><span>" + searchHistory[searchHistoryPointer].name + "</span>");
    $cityRecent.addClass("btn btn-primary btn-sm");


    $("#searchHistoryNavPills").prepend($cityRecent).show(1000);

}

//Utility function to be shown when there are no records found.
function noRecordsFound() {
    $("#messagediv").css("display", "block");
    $("#messagediv").text("No records found");
    $("#messagediv").fadeOut(4000);
    window.console.clear();
}