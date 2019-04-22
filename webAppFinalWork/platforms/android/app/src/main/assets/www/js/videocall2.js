var isAudio = false;

ConnectyCube.init(
    CONFIG.CREDENTIALS,
    CONFIG.APP_CONFIG
);

var statesPeerConn = _.invert(ConnectyCube.videochat.PeerConnectionState);

Backbone.history.start();


function dovideocall() {
    // /** Hangup */
    // if ($btn.hasClass('hangup')) {
    //     if(!_.isEmpty(app.currentSession)) {
    //
    //         app.currentSession.stop({});
    //         app.currentSession = {};
    //
    //         app.helpers.stateBoard.update({
    //             'title': 'tpl_default',
    //             'property': {
    //                 'name':  app.caller.login
    //             }
    //         });
    //
    //         return false;
    //     }
    if(false){

    } else {
        /** Check internet connection */
        if(!window.navigator.onLine) {
            app.helpers.stateBoard.update({'title': 'no_internet', 'isError': 'cb-error'});
            return false;
        }

        /** Check callee */
        // if(_.isEmpty(app.callees)) {
        //     $('#error_no_calles').modal();
        //     return false;
        // }

        var calleesIds = [101110]
        app.currentSession = ConnectyCube.videochat.createNewSession(calleesIds, isAudio ? ConnectyCube.videochat.CallType.AUDIO : ConnectyCube.videochat.CallType.VIDEO, null, {'bandwidth': 128});

        var mediaParams;
        if(isAudio) {
            mediaParams = {
                audio: true,
                video: false
            };
            document.querySelector('.j-actions[data-call="video"]').setAttribute('hidden', true);
            document.querySelector('.j-caller__ctrl').setAttribute('hidden', true);
        } else {
            mediaParams = {
                audio: true,
                video: true,
                elementId: 'localVideo',
                options: {
                    muted: true,
                    mirror: true
                }
            };
        }

        console.log("before getUserMedia");
        app.currentSession.getUserMedia(mediaParams, function(err, stream) {
          console.log("getUserMedia err " + err);
            if (err || !stream.getAudioTracks().length || (isAudio ? false : !stream.getVideoTracks().length)) {
                var errorMsg = '';

                app.currentSession.stop({});

                app.helpers.stateBoard.update({
                    'title': 'tpl_device_not_found',
                    'isError': 'cb-error',
                    'property': {
                        'name': app.caller.login
                    }
                });
            } else {
                var callParameters = {};

                if(isAudio){
                    callParameters.callType = 2;
                }

                // Call to users
                //
                var pushRecipients = [];
                app.currentSession.call({}, function() {
                    if (!window.navigator.onLine) {
                        app.currentSession.stop({});
                        app.helpers.stateBoard.update({'title': 'connect_error', 'isError': 'cb-error'});
                    } else {
                        var compiled = _.template( $('#callee_video').html() );

                        app.helpers.stateBoard.update({'title': 'calling'});

                        document.getElementById(sounds.call).play();

                        Object.keys(app.callees).forEach(function(id, i, arr) {
                            videoElems += compiled({
                                'userID': id,
                                'name': app.callees[id],
                                'state': 'connecting'
                            });
                            pushRecipients.push(id);
                        });

                        $('.j-callees').append(videoElems);

                        //$bandwidthSelect.attr('disabled', true);
                        //$btn.addClass('hangup');
                    }
                });

                // and also send push notification about incoming call
                // (corrently only iOS/Android users will receive it)
                //
                var params = {
                  notification_type: 'push',
                  user: {ids: pushRecipients},
                  environment: 'development', // environment, can be 'production' as well.
                  message: ConnectyCube.pushnotifications.base64Encode(app.caller.login + ' is calling you')
                };
                //
                ConnectyCube.pushnotifications.events.create(params, function(err, response) {
                  if (err) {
                    console.log(err);
                  } else {
                    console.log("Push Notification is sent.");
                  }
                });


            }
        });
    }
}


        ConnectyCube.chat.onDisconnectedListener = function() {
            console.log('onDisconnectedListener.');
        };

        ConnectyCube.videochat.onCallStatsReport = function onCallStatsReport(session, userId, stats, error) {
            console.group('onCallStatsReport');
                console.log('userId: ', userId);
                console.log('session: ', session);
                console.log('stats: ', stats);
            console.groupEnd();

            if (stats.remote.video.bitrate) {
                $('#bitrate_' + userId).text('video bitrate: ' + stats.remote.video.bitrate);
            } else if (stats.remote.audio.bitrate) {
                $('#bitrate_' + userId).text('audio bitrate: ' + stats.remote.audio.bitrate);
            }
        };

        ConnectyCube.videochat.onSessionCloseListener = function onSessionCloseListener(session){
            console.log('onSessionCloseListener: ', session);

            document.getElementById(sounds.call).pause();
            document.getElementById(sounds.end).play();

            $('.j-actions').removeClass('hangup');
            $('.j-caller__ctrl').removeClass('active');
            $(ui.bandwidthSelect).attr('disabled', false);

            $('.j-callees').empty();
            $('.frames_callee__bitrate').hide();

            app.currentSession.detachMediaStream('main_video');
            app.currentSession.detachMediaStream('localVideo');

            remoteStreamCounter = 0;

            if(session.opponentsIDs.length > 1) {
                app.helpers.stateBoard.update({
                    'title': 'tpl_call_stop',
                    'property': {
                        'name': app.caller.login
                    }
                });
            } else {
                app.helpers.stateBoard.update({
                    title: 'tpl_default',
                    property: {
                        'name':  app.caller.login
                    }
                });
            }

            if(document.querySelector('.j-actions[hidden]')){
                document.querySelector('.j-actions[hidden]').removeAttribute('hidden');
            }
            if(document.querySelector('.j-caller__ctrl')){
                document.querySelector('.j-caller__ctrl').removeAttribute('hidden');
            }

        };

        ConnectyCube.videochat.onUserNotAnswerListener = function onUserNotAnswerListener(session, userId) {
            console.group('onUserNotAnswerListener.');
                console.log('UserId: ', userId);
                console.log('Session: ', session);
            console.groupEnd();

            var opponent = _.findWhere(app.users, {'id': +userId});

            /** It's for p2p call */
            if(session.opponentsIDs.length === 1) {
                app.helpers.stateBoard.update({
                    'title': 'p2p_call_stop',
                    'property': {
                        'name': opponent.login,
                        'currentName': app.caller.login,
                        'reason': 'not answered'
                    }
                });
            } else {
                $('.j-callee_status_' + userId).text('No Answer');
            }
        };

        ConnectyCube.videochat.onCallListener = function onCallListener(session, extension) {
            console.group('onCallListener.');
                console.log('Session: ', session);
                console.log('Extension: ', extension);
            console.groupEnd();

            app.currentSession = session;

            ui.insertOccupants().then(function(users) {
                app.users = users;
                var initiator = _.findWhere(app.users, {id: session.initiatorID});
                app.callees = {};
                /** close previous modal */
                $(ui.income_call).modal('hide');

                $('.j-ic_initiator').text(initiator.login);

                // check the current session state
                if (app.currentSession.state !== ConnectyCube.videochat.SessionConnectionState.CLOSED){
                    $(ui.income_call).modal('show');
                    document.getElementById(sounds.rington).play();
                }
            });
        };

        ConnectyCube.videochat.onRejectCallListener = function onRejectCallListener(session, userId, extension) {
            console.group('onRejectCallListener.');
                console.log('UserId: ' + userId);
                console.log('Session: ' + session);
                console.log('Extension: ' + JSON.stringify(extension));
            console.groupEnd();

            var user = _.findWhere(app.users, {'id': +userId}),
                userCurrent = _.findWhere(app.users, {'id': +session.currentUserID});

            /** It's for p2p call */
            if(session.opponentsIDs.length === 1) {
                app.helpers.stateBoard.update({
                    'title': 'p2p_call_stop',
                    'property': {
                        'name': user.login,
                        'currentName': userCurrent.login,
                        'reason': 'rejected the call'
                    }
                });
            } else {
                var userInfo = _.findWhere(app.users, {'id': +userId});
                app.calleesRejected.push(userInfo);
                $('.j-callee_status_' + userId).text('Rejected');
            }
        };

        ConnectyCube.videochat.onStopCallListener = function onStopCallListener(session, userId, extension) {
            console.group('onStopCallListener.');
                console.log('UserId: ', userId);
                console.log('Session: ', session);
                console.log('Extension: ', extension);
            console.groupEnd();

            app.helpers.notifyIfUserLeaveCall(session, userId, 'hung up the call', 'Hung Up');
        };

        ConnectyCube.videochat.onAcceptCallListener = function onAcceptCallListener(session, userId, extension) {
            console.group('onAcceptCallListener.');
                console.log('UserId: ', userId);
                console.log('Session: ', session);
                console.log('Extension: ', extension);
            console.groupEnd();

            var userInfo = _.findWhere(app.users, {'id': +userId}),
                filterName = $.trim( $(ui.filterSelect).val() );

            document.getElementById(sounds.call).pause();
            app.currentSession.update({'filter': filterName});

            /** update list of callee who take call */
            app.calleesAnwered.push(userInfo);

            if(app.currentSession.currentUserID === app.currentSession.initiatorID) {
                app.helpers.stateBoard.update({
                    'title': 'tpl_call_status',
                    'property': {
                        'users': app.helpers.getUsersStatus()
                    }
                });
            }
        };

        ConnectyCube.videochat.onRemoteStreamListener = function onRemoteStreamListener(session, userId, stream) {
            console.group('onRemoteStreamListener.');
                console.log('userId: ', userId);
                console.log('Session: ', session);
                console.log('Stream: ', stream);
            console.groupEnd();

            var state = app.currentSession.connectionStateForUser(userId),
                peerConnList = ConnectyCube.videochat.PeerConnectionState;

            if(state === peerConnList.DISCONNECTED || state === peerConnList.FAILED || state === peerConnList.CLOSED) {
                return false;
            }

            app.currentSession.peerConnections[userId].stream = stream;

            console.info('onRemoteStreamListener add video to the video element', stream);

            app.currentSession.attachMediaStream('remote_video_' + userId, stream);

            if( remoteStreamCounter === 0) {
                $('#remote_video_' + userId).click();

                app.mainVideo = userId;
                ++remoteStreamCounter;
            }

            if(!call.callTimer) {
                call.callTimer = setInterval( function(){ call.updTimer.call(call); }, 1000);
            }

            $('.frames_callee__bitrate').show();
        };

        ConnectyCube.videochat.onUpdateCallListener = function onUpdateCallListener(session, userId, extension) {
            console.group('onUpdateCallListener.');
                console.log('UserId: ' + userId);
                console.log('Session: ' + session);
                console.log('Extension: ' + JSON.stringify(extension));
            console.groupEnd();

            app.helpers.changeFilter('#remote_video_' + userId, extension.filter);

            if (+(app.mainVideo) === userId) {
                app.helpers.changeFilter('#main_video', extension.filter);
            }
        };

        ConnectyCube.videochat.onSessionConnectionStateChangedListener = function onSessionConnectionStateChangedListener(session, userId, connectionState) {
            console.group('onSessionConnectionStateChangedListener.');
                console.log('UserID:', userId);
                console.log('Session:', session);
                console.log('Сonnection state:', connectionState, statesPeerConn[connectionState]);
            console.groupEnd();

            var connectionStateName = _.invert(ConnectyCube.videochat.SessionConnectionState)[connectionState],
                $calleeStatus = $('.j-callee_status_' + userId),
                isCallEnded = false;

            if(connectionState === ConnectyCube.videochat.SessionConnectionState.CONNECTING) {
                $calleeStatus.text(connectionStateName);
            }

            if(connectionState === ConnectyCube.videochat.SessionConnectionState.CONNECTED) {
                app.helpers.toggleRemoteVideoView(userId, 'show');
                $calleeStatus.text(connectionStateName);
            }

            if(connectionState === ConnectyCube.videochat.SessionConnectionState.COMPLETED) {
                app.helpers.toggleRemoteVideoView(userId, 'show');
                $calleeStatus.text('connected');
            }

            if(connectionState === ConnectyCube.videochat.SessionConnectionState.DISCONNECTED) {
                app.helpers.toggleRemoteVideoView(userId, 'hide');
                $calleeStatus.text('disconnected');
            }

            if(connectionState === ConnectyCube.videochat.SessionConnectionState.CLOSED){
                app.helpers.toggleRemoteVideoView(userId, 'clear');

                if(app.mainVideo === userId) {
                    $('#remote_video_' + userId).removeClass('active');

                    app.helpers.changeFilter('#main_video', 'no');
                    app.mainVideo = 0;
                }

                if( !_.isEmpty(app.currentSession) ) {
                    if ( Object.keys(app.currentSession.peerConnections).length === 1 || userId === app.currentSession.initiatorID) {
                        $(ui.income_call).modal('hide');
                        document.getElementById(sounds.rington).pause();
                    }
                }

                isCallEnded = _.every(app.currentSession.peerConnections, function(i) {
                    return i.iceConnectionState === 'closed';
                });

                /** remove filters */

                if( isCallEnded ) {
                    app.helpers.changeFilter('#localVideo', 'no');
                    app.helpers.changeFilter('#main_video', 'no');
                    $(ui.filterSelect).val('no');

                    app.calleesAnwered = [];
                    app.calleesRejected = [];
                    app.network[userId] = null;
                }

                if (app.currentSession.currentUserID === app.currentSession.initiatorID && !isCallEnded) {
                    var userInfo = _.findWhere(app.users, {'id': +userId});

                    /** get array if users without user who ends call */
                    app.calleesAnwered = _.reject(app.calleesAnwered, function(num){ return num.id === +userId; });
                    app.calleesRejected.push(userInfo);

                    app.helpers.stateBoard.update({
                       'title': 'tpl_call_status',
                       'property': {
                           'users': app.helpers.getUsersStatus()
                        }
                    });
                }

                if( _.isEmpty(app.currentSession) || isCallEnded ) {
                    if(call.callTimer) {
                        $('#timer').addClass('invisible');
                        clearInterval(call.callTimer);
                        call.callTimer = null;
                        call.callTime = 0;
                        app.helpers.network = {};
                    }
                }
            }
        };

        ConnectyCube.videochat.onDevicesChangeListener = function onDevicesChangeListeners() {
          console.log("onDevicesChangeListener");
        };
