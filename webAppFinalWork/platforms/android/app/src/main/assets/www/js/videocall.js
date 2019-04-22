;(function(window, ConnectyCube, app, CONFIG, $, Backbone) {
    'use strict';

    $(function() {
        var sounds = {
            'call': 'callingSignal',
            'end': 'endCallSignal',
            'rington': 'ringtoneSignal'
        };

        var call = {
            callTime: 0,
            callTimer: null,
            updTimer: function() {
                this.callTime += 1000;

                $('#timer').removeClass('invisible')
                    .text( new Date(this.callTime).toUTCString().split(/ /)[4] );
              }
        };

        var remoteStreamCounter = 0;


              app.caller = CONFIG.USERS[0];
              app.callees = CONFIG.USERS[1];
              app.calleesAnwered = [];
              app.calleesRejected = [];
              app.users = [];

                /** Before use WebRTC checking WebRTC is avaible */
                // if (!ConnectyCube.videochat) {
                //     alert('Error: ' + CONFIG.MESSAGES.webrtc_not_avaible);
                //     return;
                // }
                //
                // if(_.isEmpty(app.caller)) {
                //   window.location.href = "../chat.html";
                // }



        /**
         * INIT
         */
        console.log(CONFIG.CREDENTIALS);

        if (CONFIG.USERS.length < 2){
            var error = "The config.js file should contain at least 2 users.";
            console.error(error);
            throw error;
        }

        ConnectyCube.init(
            CONFIG.CREDENTIALS,
            CONFIG.APP_CONFIG
        );

        var statesPeerConn = _.invert(ConnectyCube.videochat.PeerConnectionState);

        //app.router = new Router();
        Backbone.history.start();

        if(!window.navigator.onLine) {
            alert(CONFIG.MESSAGES['no_internet']);
            return false;
        }


                ConnectyCube.chat.connect({
                    userId: app.caller.id,
                    password: app.caller.password
                }, function(err, res) {
                    if(err) {
                        if(!_.isEmpty(app.currentSession)) {
                            app.currentSession.stop({});
                            app.currentSession = {};
                        }
                        app.mainVideo = 0;

                        app.calleesAnwered = [];
                        app.calleesRejected = [];
                        if(call.callTimer) {
                            $('#timer').addClass('invisible');
                            clearInterval(call.callTimer);
                            call.callTimer = null;
                            call.callTime = 0;
                            app.helpers.network = {};
                        }
                    } else {
                        //$form.removeClass('join-wait');
                        //$form.trigger('reset');
                        //app.router.navigate('dashboard', { trigger: true });
                    }
                });


                /** Check internet connection */
                if(!window.navigator.onLine) {
                    return false;
                }

                /** Check callee */
                if(_.isEmpty(app.callees)) {
                    $('#error_no_calles').modal();
                    //TODO: back to chat
                    return false;
                }

                app.currentSession = ConnectyCube.videochat.createNewSession([app.callees.id],ConnectyCube.videochat.CallType.VIDEO, null, {'bandwidth': 128});
                console.log("key:" + Object.keys(app.callees));

                var mediaParams;

                    mediaParams = {
                        audio: true,
                        video: true,
                        elementId: 'localVideo',
                        options: {
                            muted: true,
                            mirror: true
                        }
                    };


                console.log("before getUserMedia");
                app.currentSession.getUserMedia(mediaParams, function(err, stream) {
                  console.log("getUserMedia err " + err);
                    if (err || !stream.getAudioTracks().length || (!stream.getVideoTracks().length)) {
                        var errorMsg = '';

                        app.currentSession.stop({});

                    } else {
                        var callParameters = {};


                        // Call to users
                        //
                        var pushRecipients = [];
                          var videoElems = '';
                        app.currentSession.call({}, function() {
                            if (!window.navigator.onLine) {
                                app.currentSession.stop({});
                            } else {
                                var compiled = _.template( $('#callee_video').html() );


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
            //  }


        /** DECLINE */
        $(document).on('click', '.j-decline', function() {
            if (!_.isEmpty(app.currentSession)) {
                app.currentSession.reject({});


                document.getElementById(sounds.rington).pause();
            }
        });

        /** ACCEPT */
        $(document).on('click', '.j-accept', function() {
            isAudio = app.currentSession.callType === ConnectyCube.videochat.CallType.AUDIO;

            var mediaParams;

                mediaParams = {
                    audio: true,
                    video: true,
                    elementId: 'localVideo',
                    options: {
                        muted: true,
                        mirror: true
                    }
                };



            var videoElems = '';

            document.getElementById(sounds.rington).pause();

            app.currentSession.getUserMedia(mediaParams, function(err, stream) {
                if (err || !stream.getAudioTracks().length || (isAudio ? false : !stream.getVideoTracks().length)) {
                    var errorMsg = '';

                    app.currentSession.stop({});

                } else {
                    var opponents = [app.currentSession.initiatorID],
                        compiled = _.template( $('#callee_video').html() );

                    $('.j-actions').addClass('hangup');

                    /** get all opponents */
                    app.currentSession.opponentsIDs.forEach(function(userID, i, arr) {
                        if(userID != app.currentSession.currentUserID){
                            opponents.push(userID);
                        }
                    });
                    opponents.forEach(function(userID, i, arr) {

                        var peerState = app.currentSession.connectionStateForUser(userID),
                            userInfo = _.findWhere(app.users, {'id': +userID});
                        if( (document.getElementById('remote_video_' + userID) === null) ) {
                            videoElems += compiled({
                                'userID': userID,
                                'name': userInfo ? userInfo.login : 'userID ' + userID,
                                'state': app.helpers.getConStateName(peerState)
                            });

                            if(peerState === ConnectyCube.videochat.PeerConnectionState.CLOSED){
                                app.helpers.toggleRemoteVideoView(userID, 'clear');
                            }
                        }
                    });
                    $('.j-callees').append(videoElems);

                    console.log("accept..");
                    app.currentSession.accept({});
                }
            });
        });


        $(document).on('click', '.j-callees__callee__video', function() {
            var $that = $(this),
                userId = +($(this).data('user')),
                activeClass = [];

            if( app.currentSession.peerConnections[userId].stream && !$that.srcObject ) {
                if( $that.hasClass('active') ) {
                    $that.removeClass('active');

                    app.currentSession.detachMediaStream('main_video');
                    app.mainVideo = 0;
                    remoteStreamCounter = 0;
                } else {
                    $('.j-callees__callee_video').removeClass('active');
                    $that.addClass('active');



                    app.currentSession.attachMediaStream('main_video', app.currentSession.peerConnections[userId].stream);
                    app.mainVideo = userId;
                }
            }
        });

        $(document).on('click', '.j-caller__ctrl', function() {
           var $btn = $(this),
               isActive = $btn.hasClass('active');

           if( _.isEmpty( app.currentSession)) {
               return false;
           } else {
               if(isActive) {
                   $btn.removeClass('active');
                   app.currentSession.unmute( $btn.data('target') );
               } else {
                   $btn.addClass('active');
                   app.currentSession.mute( $btn.data('target') );
               }
           }
        });

        /**
         * SDK Event listeners:
         *
         * [Recommendation]
         * We recomend use Function Declaration
         * that SDK could identify what function(listener) has error
         *
         * Chat:
         * - onDisconnectedListener
         * WebRTC:
         * - onCallListener
         * - onCallStatsReport
         * - onUpdateCallListener
         *
         * - onAcceptCallListener
         * - onRejectCallListener
         * - onUserNotAnswerListener
         *
         * - onRemoteStreamListener
         *
         * - onStopCallListener
         * - onSessionCloseListener
         * - onSessionConnectionStateChangedListener
         *
         * - onDevicesChangeListener
         */

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

            $('.j-callees').empty();
            $('.frames_callee__bitrate').hide();

            app.currentSession.detachMediaStream('main_video');
            app.currentSession.detachMediaStream('localVideo');

            remoteStreamCounter = 0;


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

        };

        ConnectyCube.videochat.onCallListener = function onCallListener(session, extension) {
            console.group('onCallListener.');
                console.log('Session: ', session);
                console.log('Extension: ', extension);
            console.groupEnd();

            app.currentSession = session;


        };

        ConnectyCube.videochat.onRejectCallListener = function onRejectCallListener(session, userId, extension) {
            console.group('onRejectCallListener.');
                console.log('UserId: ' + userId);
                console.log('Session: ' + session);
                console.log('Extension: ' + JSON.stringify(extension));
            console.groupEnd();

            var user = _.findWhere(app.users, {'id': +userId}),
                userCurrent = _.findWhere(app.users, {'id': +session.currentUserID});

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

            var userInfo = _.findWhere(app.users, {'id': +userId});

            document.getElementById(sounds.call).pause();

            /** update list of callee who take call */
            app.calleesAnwered.push(userInfo);

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

                    app.mainVideo = 0;
                }

                if( !_.isEmpty(app.currentSession) ) {
                    if ( Object.keys(app.currentSession.peerConnections).length === 1 || userId === app.currentSession.initiatorID) {
                        document.getElementById(sounds.rington).pause();
                    }
                }

                isCallEnded = _.every(app.currentSession.peerConnections, function(i) {
                    return i.iceConnectionState === 'closed';
                });


                if( isCallEnded ) {

                    app.calleesAnwered = [];
                    app.calleesRejected = [];
                    app.network[userId] = null;
                }

                if (app.currentSession.currentUserID === app.currentSession.initiatorID && !isCallEnded) {
                    var userInfo = _.findWhere(app.users, {'id': +userId});

                    /** get array if users without user who ends call */
                    app.calleesAnwered = _.reject(app.calleesAnwered, function(num){ return num.id === +userId; });
                    app.calleesRejected.push(userInfo);

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

        // private functions
        function closeConn(userId) {
            app.helpers.notifyIfUserLeaveCall(app.currentSession, userId, 'disconnected', 'Disconnected');
            app.currentSession.closeConnection(userId);
        }

    });
}(window, window.ConnectyCube, window.app, window.CONFIG,  jQuery, Backbone));
