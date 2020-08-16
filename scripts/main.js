let searchHistory = [];
let searchHistoryPointer = 0;
let dataObject;
// This object's clone will be used to create actual data.
let templateObject = {
    cityName: "",
    iconUrl: "",
    temperature: "",
    humidity: "",
    windSpeed: "",
    uv: "",
    coord: { lat: 0, long: 0 },
    unit: "",
    url: ""
}



$(document).ready(function () {
    //page load animation - This play a small video on page load and fadeout in 3s
    $("#pageloadvid").fadeOut(3000);

    
    $("#searchIconButton").on("click", buildSearchData);
    $("#btnLeft").on("click", showPreviousSearchedItem);
    $("#btnRight").on("click", showNextSearchedItem);
});

var apikey = '166a433c57516f51dfab1f7edaed8413';
// var queryURL=`https://api.openweathermap.org/data/2.5/forecast/daily?q=${city}&cnt=5&appid=${apikey}`;

// Eventhandler on click of searchButton and *** recent Searches buttons ***
function buildSearchData(e){
    event.preventDefault();
    let sVal = $("#search").val()
    searchCity =  sVal !== "" ? sVal :$(this).data('id').replace("_",",");
    fetchWeatherData(searchCity)
}

function fetchWeatherData(searchCity) {
    // alert(searchCity);
    // return;
    
    let city = $("#search").val();
    var queryURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apikey}`;
    $.ajax({
        url: queryURL,
        method: 'GET',
        statusCode: {
            404: function () {
                alert("page not found");
            }
        },
        success: function () { alert("hurrah"); }
    }).then(buildFullCityName)
        .then(addToRecentSearches);
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
    // alert(data.name);
    // return;
    $.ajaxSetup({
        async: false
    });
    dataObject = data;
    $.ajax({
        url: "scripts/city.list.json",
        method: 'GET',
        async: false,
        success: function (cityList) {

            let cityObject = cityList.find(elment => elment.id === data.id);
            // let cityObject = cityList[index];
            if (cityObject.state === "") {
                dataObject.fullname = `${cityObject.name},${cityObject.country}`;
            }
            else {
                dataObject.fullname = `${cityObject.name},${cityObject.state},${cityObject.country}`;
            }
        }
    });
    return dataObject;
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