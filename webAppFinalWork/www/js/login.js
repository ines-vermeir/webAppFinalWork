$(document).on('pagebeforeshow', '#login', function(){
    $('#login-button').on('click', function(){
        if($('#username').val().length > 0 && $('#password').val().length > 0){
            user.username = $('#username').val();
            user.password = $('#password').val();
            var userJSON = JSON.stringify(user);
            console.log(userJSON);
            ajax.sendRequest(userJSON);
        } else {
            alert('Niet alle velden zijn ingevuld.');
        }
    });
});

// "C:\Program Files (x86)\Google\Chrome\Application\Chrome.exe" --user-data-dir="C:/Chrome dev session" --disable-web-security[91876:47192:0412/162022.861:ERROR:browser_process_sub_thread.cc(209)] Waited 18 ms for network service


// $(document).on('pagebeforeshow', '#index', function(){
//     if(userObject.username.length == 0){ // If username is not set (lets say after force page refresh) get us back to the login page
//         $.mobile.changePage( "#login", { transition: "slide"} ); // In case result is true change page to Index
//     }
//     $(this).find('[data-role="header"] h3').append('Wellcome ' + userObject.username); // Change header with wellcome msg
//     //$("#index").trigger('pagecreate');
// });

var ajax = {
    sendRequest:function(save_data){
        $.ajax({
            url: 'http://localhost:8080/login',
            contentType: 'application/json; charset=utf8',
            data: save_data,
            async: true,
            type: 'POST',
            beforeSend: function() {
                // This callback function will trigger before data is sent
                //$.mobile.showPageLoadingMsg(true); // This will show ajax spinner
            },
            complete: function() {
                // This callback function will trigger on data sent/received complete
                //$.mobile.hidePageLoadingMsg(); // This will hide ajax spinner
            },
            success: function (result) {
                if(result != null && result != "" ) {
                    window.location.href = 'chat.html';
                } else {
                    alert('Foute login gegevens, probeer opnieuw!'); // In case result is false throw an error
                }
                // This callback function will trigger on successful action
            },
            error: function (request,error) {
                // This callback function will trigger on unsuccessful action
                console.error('Er is iets fout gelopen bij het inloggen');
            }
        });
    }
}

// We will use this object to store username and password before we serialize it and send to server. This part can be done in numerous ways but I like this approach because it is simple
var user = {
    username : "",
    password : ""
}
