;(function(window) {
   'use strict';

   const MESSAGES = {
       'login': 'Login as any user on this computer and another user on another computer.',
       'create_session': 'Creating a session...',
       'connect': 'Connecting...',
       'connect_error': 'Something went wrong with the connection. Check internet connection or user info and try again.',
       'login_as': 'Logged in as ',
       'title_login': 'Choose a user to login with:',
       'title_callee': 'Choose users to call:',
       'calling': 'Calling...',
       'webrtc_not_avaible': 'WebRTC is not available in your browser',
       'no_internet': 'Please check your Internet connection and try again'
   };

   const CC_CREDENTIALS = {
     appId: 637,
     authKey: 'HBPTdMYwk8KsQzG',
     authSecret: 'Dk8cHEXRzczYner'
   };

   const CC_CONFIG = {
       // endpoints: {
       //     api: "",
       //     chat: ""
       // },
       debug: true,
       videocalling: {
           answerTimeInterval: 30,
           dialingTimeInterval: 5,
           disconnectTimeInterval: 35,
           statsReportTimeInterval: 5
       }
   };

   const CC_USERS = [
         {
           id: 101108	,
           login: "ines.vermeir@student.ehb.be",
           password: "admin123"
         },
         {
             id: 101110	,
             login: "ines.vermeir@hotmail.com",
             password: "praatmaatje"
         }
       ];

   window.CONFIG = {
       'CREDENTIALS': CC_CREDENTIALS,
       'APP_CONFIG': CC_CONFIG,
       'USERS': CC_USERS,
       'MESSAGES': MESSAGES
   };
}(window));
