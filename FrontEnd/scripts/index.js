var clothMgmtManager = (function () {

    var isLoggedIn = false;
    var loadedContainer = '';
    var userInfo = {};

    var loadLoginPage = function (notification) {
        console.log('initial setup');
        $('.navbar-nav').hide();
        $.get('html/login.html', function (data) {
            $('#container').empty();
            $('#container').append(data);
            if (notification != '') {
                $('#notification').html(notification);
                $('#notification').css({ color: 'green', fontSize: 'x-small' });
                $('#notification').show();
            }
        });
        this.loadedContainer = 'login-container';
    };

    var loadRegisterPage = function () {
        console.log('loadRegisterpage');
        $.get('html/register.html', function (data) {
            $('#container').empty();
            $('#container').append(data);
        });

        this.loadedContainer = 'signup-container';
    };

    var loadDashboardPage = function () {
        console.log('loadDashboardPage: ', sessionStorage.getItem('userType'));

        $('#navProfileDropDown').html(sessionStorage.getItem('loggedInUserName'));
        $('#notification').hide();
        var resourceURI = "html/dashboard.html";

        if (sessionStorage.getItem('userType') === "Orphanage") {
            resourceURI = "html/orphanage_dashboard.html"
        }
        $.get(resourceURI, function (data) {
            $('#container').empty();
            $('#container').append(data);
            if (sessionStorage.getItem('userType') === "Orphanage") {
                $.ajax({
                    url: 'http://localhost:5000/rest/notifications',
                    method: 'GET',
                    dataType: 'json',
                    contentType: 'application/json',
                    success: function (result, status, jqXHR) {
                        console.log('msg:', result);
                        if (result.length > 0) {
                            $.each(result, (item, data) => {
                                if (data["notification"]['collection_status'] === "New") {
                                    $('#orph-default-notification-info').hide();

                                    // $('#userNotifications-div').empty();
                                    $('#userNotifications-div').append(
                                        '<div id="notification-' + data["notification"]['id'] + '" class="card mb-1" style="width: 35rem;"><div class="card-body" style="background:#a3d1da;">'
                                        + '<h5 class="card-title">Donation ID: #' + data["notification"]['id']
                                        + '</h5> <h6 class="card-subtitle mb-2 text-muted"> Created on: ' + data["notification"]['date_created'] + '</h6><p class="card-text">'
                                        + '<strong> Doner name: </strong> ' + data["user"]['name']
                                        + '<br><strong> Address: </strong> ' + data["user"]['address']
                                        + '<br><strong> Email ID: </strong> ' + data["user"]['email_id']
                                        + '<br><strong> Phone No: </strong> ' + data["user"]['phone_no']
                                        + '<br><strong> Quantity: </strong> ' + data["notification"]['quantity'] + ' kg'
                                        + '<br><strong> Collection status: </strong> ' + data["notification"]['collection_status']
                                        + '</p>'
                                        + "<button id='optIn-btn-" + data["notification"]['id'] + "' type='button' class='btn btn-primary float-end me-2' onclick='clothMgmtManager.optInDonation(" + data['notification']['id'] + ")';>Opt in</button></div></div>"
                                    );
                                }
                            });
                        }
                    },
                    error(jqXHR, textStatus, errorThrown) {
                        console.log('error:', jqXHR)
                    }
                });
            }
            setListeners();
            if (JSON.stringify(userInfo) === '{}') {
                loadUserInfo();
            }
        });

        this.loadedContainer = 'dashboard-container';
    };

    var loadProfilePage = function () {
        console.log('loadProfilePage: ', sessionStorage.getItem('loggedInUserName'));
        $('#notification').hide();

        $.get('html/profile.html', function (data) {
            $('#container').empty();
            $('#container').append(data);
            if (JSON.stringify(userInfo) === '{}') {
                updateProfileInfo();
            }
            else {
                $.ajax({
                    url: 'http://localhost:5000/rest/user_info',
                    method: 'GET',
                    data: { 'email_id': sessionStorage.getItem('loggedInUserName') },
                    dataType: 'json',
                    cache: false,
                    contentType: 'application/json',
                    success: function (data, status, jqXHR) {
                        console.log('data:', data);
                        userInfo = data;
                        updateProfileInfo();
                    },
                    error(jqXHR, textStatus, errorThrown) {
                        console.log('error:', jqXHR)
                    }
                });
            }
        });

        this.loadedContainer = 'profile-container';
    };

    var optInDonation = function (notificationId) {
        console.log("optInDonation is called: notification-" + notificationId);
        let requestBody = {
            "notification_id": notificationId,
            "user_id": sessionStorage.getItem('loggedInUserId')
        };
        console.log('requestBody:', requestBody);
        $.ajax({
            url: 'http://localhost:5000/rest/opt-in',
            method: 'PUT',
            data: JSON.stringify(requestBody),
            dataType: 'json',
            contentType: 'application/json',
            success: function (data, status, jqXHR) {
                console.log('msg:', data);
                $('#notification-' + notificationId).remove();
                $('#orph-default-notification-info').show();
            },
            error(jqXHR, textStatus, errorThrown) {
                console.log('error:', jqXHR)
            }
        });
    };

    var markAsCollected = function (notificationId) {
        console.log("optInDonation is called: notification-" + notificationId);
        let requestBody = {
            "notification_id": notificationId,
            "user_id": sessionStorage.getItem('loggedInUserId')
        };
        console.log('requestBody:', requestBody);
        $.ajax({
            url: 'http://localhost:5000//rest/opt-in/update',
            method: 'PUT',
            data: JSON.stringify(requestBody),
            dataType: 'json',
            contentType: 'application/json',
            success: function (data, status, jqXHR) {
                console.log('msg:', data);
                $("#collect-btn-"+ notificationId).remove();
                updateNotifications();
            },
            error(jqXHR, textStatus, errorThrown) {
                console.log('error:', jqXHR)
            }
        });
    };

    var loadUserInfo = function () {

        $.ajax({
            url: 'http://localhost:5000/rest/user_info',
            method: 'GET',
            data: { 'email_id': sessionStorage.getItem('loggedInUserName') },
            dataType: 'json',
            cache: false,
            contentType: 'application/json',
            success: function (data, status, jqXHR) {
                console.log('data:', data);
                userInfo = data;
            },
            error(jqXHR, textStatus, errorThrown) {
                console.log('error:', jqXHR)
            }
        });
    }

    var updateProfileInfo = function () {
        $('#card-title').html(userInfo['name']);
        $('#card-subtitle').html(userInfo['email_id']);
        $('#card-text').html(userInfo['address'] + '<br>' + userInfo['phone_no'] + '<br> <b>User type:</b> ' + userInfo["user_type"]);
        $('#profile-back-btn').show();
    }

    var validateLogin = function () {
        let requestBody = {
            'user_name': $('#loginEmailId').val(),
            'password': $('#loginPassword').val()
        };
        console.log('requestBody:', requestBody);
        $.ajax({
            url: 'http://localhost:5000/rest/login',
            method: 'POST',
            data: JSON.stringify(requestBody),
            dataType: 'json',
            contentType: 'application/json',
            success: function (data, status, jqXHR) {
                console.log('msg:', data);
                if (data.hasOwnProperty('result')) {
                    $('#notification').html('Invalid Username/Password!!');
                    $('#notification').css({ color: 'red', fontSize: 'x-small' });
                    $('#notification').show();
                }
                else {
                    $('#notification').hide();
                    isLoggedIn = true;
                    if (typeof (Storage) !== 'undefined') {
                        sessionStorage.setItem('loggedInUserName', data["email_id"]);
                        sessionStorage.setItem('isLoggedIn', true);
                        sessionStorage.setItem('userType', data["user_type"]);
                        sessionStorage.setItem('loggedInUserId', data["id"]);

                        $('.navbar-nav').show();
                        if (JSON.stringify(userInfo) === '{}') {
                            loadUserInfo();
                        }
                        loadDashboardPage();
                    }
                }
            },
            error(jqXHR, textStatus, errorThrown) {
                console.log('error:', jqXHR)
            }
        });
    };

    var registerUser = function () {
        let requestBody = {
            'email_id': $('#userEmail').val(),
            'name': $('#userName').val(),
            'address': $('#userAddress').val(),
            'phone_no': $('#userPhoneNo').val(),
            'password': $('#userPassword').val(),
            'user_type': $('#userType').val()
        };
        console.log('requestBody:', requestBody);
        $.ajax({
            url: 'http://localhost:5000/rest/user',
            method: 'POST',
            data: JSON.stringify(requestBody),
            dataType: 'json',
            contentType: 'application/json',
            success: function (result, status, jqXHR) {
                console.log('msg:', result)
                loadLoginPage('Sign up is sucessful, Please login!!');
            },
            error(jqXHR, textStatus, errorThrown) {
                console.log('error:', jqXHR)
            }
        });
    };

    var notifyDonation = function () {
        let requestBody = {
            "user_name": sessionStorage.getItem('loggedInUserName'),
            "quantity": $('#quantityRange').val()
        };
        console.log('requestBody:', requestBody);
        $('#notification').hide();
        $.ajax({
            url: 'http://localhost:5000/rest/notify',
            method: 'POST',
            data: JSON.stringify(requestBody),
            dataType: 'json',
            contentType: 'application/json',
            success: function (result, status, jqXHR) {
                console.log('msg:', result);
                $('#notification').html("Your notification is added successfully!!");
                $('#notification').css({ color: 'green', fontSize: 'x-small' });
                $('#notification').show();
            },
            error(jqXHR, textStatus, errorThrown) {
                console.log('error:', jqXHR)
            }
        });
    };


    var setListeners = function () {
        $('#donationHistoryBtn').on('click', function (e) {
            if (!this.classList.contains('collapsed')) {
                $.ajax({
                    url: 'http://localhost:5000/rest/user/notifications',
                    method: 'GET',
                    data: { 'email_id': sessionStorage.getItem('loggedInUserName') },
                    dataType: 'json',
                    contentType: 'application/json',
                    success: function (result, status, jqXHR) {
                        console.log('msg:', result);
                        if (result.length > 0) {
                            $('#default-info').hide();
                            $('#donationHistory').empty();
                            $.each(result, (item, data) => {
                                $('#donationHistory').append('<div class="card mb-1" style="width: 35rem;"><div class="card-body" style="background:#a3d1da;"><h5 class="card-title">Donation ID: #'
                                    + data['id'] + '</h5> <h6 class="card-subtitle mb-2 text-muted"> Created on: ' + data['date_created'] + '</h6>'
                                    + '<p class="card-text"><strong> Collection status: </strong> ' + data['collection_status'] + '</p>'
                                    + '</div></div>')
                            });
                        }
                    },
                    error(jqXHR, textStatus, errorThrown) {
                        console.log('error:', jqXHR)
                    }
                });
            }
        });


        $('#pickupTrackerAccBtn').on('click', function (e) {
            if (!this.classList.contains('collapsed')) {
                updateNotifications();
            }
        });
    };

    var updateNotifications = function(){
        $.ajax({
            url: 'http://localhost:5000/rest/notifications',
            method: 'GET',
            dataType: 'json',
            contentType: 'application/json',
            success: function (result, status, jqXHR) {
                console.log('msg:', result);
                if (result.length > 0) {

                    $('#orph-default-info').hide();
                    $('#pickUpHistory').empty();
                    $.each(result, (item, data) => {
                        if (data["notification"]['collection_status'] !== "New") {
                            let htmlContent = '<div id="notification-' + data["notification"]['id'] + '" class="card mb-1" style="width: 35rem;"><div class="card-body" style="background:#a3d1da;">'
                            + '<h5 class="card-title">Donation ID: #' + data["notification"]['id']
                            + '</h5> <h6 class="card-subtitle mb-2 text-muted"> Created on: ' + data["notification"]['date_created'] + '</h6><p class="card-text">'
                            + '<strong> Doner name: </strong> ' + data["user"]['name']
                            + '<br><strong> Address: </strong> ' + data["user"]['address']
                            + '<br><strong> Email ID: </strong> ' + data["user"]['email_id']
                            + '<br><strong> Phone No: </strong> ' + data["user"]['phone_no']
                            + '<br><strong> Quantity: </strong> ' + data["notification"]['quantity'] + ' kg'
                            + '<br><strong> Collection status: </strong> ' + data["notification"]['collection_status']
                            + '</p>';
                            if (data["notification"]['collection_status'] !== "Collected") {
                               htmlContent += "<button id='collect-btn-" + data["notification"]['id'] + "' type='button' class='btn btn-primary float-end me-2' onclick='clothMgmtManager.markAsCollected(" + data['notification']['id'] + ")';>Mark as Collected</button></div></div>"
                            }
                            $('#pickUpHistory').append(
                                htmlContent
                            );
                        }
                    });

                }
            },
            error(jqXHR, textStatus, errorThrown) {
                console.log('error:', jqXHR)
            }
        });
    };

    var logOutUser = function () {
        sessionStorage.clear();
        isLoggedIn = false;
        loadLoginPage("You are logged out successfully!!");
    };


    return {
        loadRegisterPage: loadRegisterPage,
        loadLoginPage: loadLoginPage,
        loadDashboardPage: loadDashboardPage,
        loadProfilePage: loadProfilePage,
        validateLogin: validateLogin,
        registerUser: registerUser,
        notifyDonation: notifyDonation,
        logOutUser: logOutUser,
        optInDonation: optInDonation,
        markAsCollected: markAsCollected
    };
})();

$(document).ready(function () {
    console.log('ready!');
    if (sessionStorage.getItem('isLoggedIn')) {
        clothMgmtManager.loadDashboardPage();
    }
    else {
        clothMgmtManager.loadLoginPage('');
    }

});