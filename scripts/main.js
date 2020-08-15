let searchHistory = [];
let searchHistoryPointer =0;
$(document).ready(function () {
    // $("body").animate({"background-color":"#f7f9fa"},2000);
    $("#pageloadvid").fadeOut(3000);
    // $("header").delay(500).fadeIn(5000);          
    // $(".logoimgcontainer").delay(1000).show(3000);
    // $('#sidebarCollapse').on('click', function () {
    //     $('#sidebar').toggleClass('active');
    // });

    $("#searchIconButton").on("click", fetchWeatherData);
    $("#btnLeft").on("click",showPreviousSearchedItem);
    $("#btnRight").on("click",showNextSearchedItem);
});

var apikey = '166a433c57516f51dfab1f7edaed8413';
// var queryURL=`https://api.openweathermap.org/data/2.5/forecast/daily?q=${city}&cnt=5&appid=${apikey}`;
function fetchWeatherData(e) {
    e.preventDefault();
    let city = $("#search").val();
    var queryURL=`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apikey}`;
    $.get(queryURL,
        function (data, statusText, xhr) {
            console.log(data);
            console.log(statusText, xhr.status);
            let cityObj=data;
            if (xhr.status === 200) {
                addToRecentSearches(data)
            }
        });
}


function addToRecentSearches(data) {
    //add to array
    searchHistory.unshift(data);

    //add to optionlist
    let opt = $("<Option>").text(data.name);
    $("#optionlist").append(opt);

    //add to aside
    $cityTemp = $("<button>").html("<span><img style='height:35px' src='http://openweathermap.org/img/wn/" + data.weather[0].icon +"@2x.png'></img></span><span>"+ data.name +"</span>");
    $cityTemp.addClass("btn btn-primary btn-sm btn-block");
    $("#searchHistoryNav").prepend($cityTemp).show(3000);

    //add to nav pills

    $("#searchHistoryNavPills").empty();
    $cityRecent = $("<button>").html("<span><img style='height:25px' src='http://openweathermap.org/img/wn/" + searchHistory[0].weather[0].icon +"@2x.png'></img></span><span>"+ searchHistory[0].name +"</span>");
    $cityRecent.addClass("btn btn-primary btn-sm");     


    $("#searchHistoryNavPills").prepend($cityRecent);
    // searchHistoryPointer++;
}

function showPreviousSearchedItem(){
    if(searchHistoryPointer === searchHistory.length-1){
        return;
    }
    searchHistoryPointer++;
    $("#searchHistoryNavPills").empty();
    $cityRecent = $("<button>").html("<span><img style='height:25px' src='http://openweathermap.org/img/wn/" + searchHistory[searchHistoryPointer].weather[0].icon +"@2x.png'></img></span><span>"+ searchHistory[searchHistoryPointer].name +"</span>");
    $cityRecent.addClass("btn btn-primary btn-sm");     


    $("#searchHistoryNavPills").prepend($cityRecent).show(1000);

}
function showNextSearchedItem(){
    if(searchHistoryPointer === 0){
        return;
    }
    searchHistoryPointer--;
    $("#searchHistoryNavPills").empty();
    $cityRecent = $("<button>").html("<span><img style='height:25px' src='http://openweathermap.org/img/wn/" + searchHistory[searchHistoryPointer].weather[0].icon +"@2x.png'></img></span><span>"+ searchHistory[searchHistoryPointer].name +"</span>");
    $cityRecent.addClass("btn btn-primary btn-sm");     


    $("#searchHistoryNavPills").prepend($cityRecent).show(1000);

}