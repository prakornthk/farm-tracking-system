<?php

return [
    'line' => [
        'client_id' => env('LINE_CLIENT_ID'),
        'client_secret' => env('LINE_CLIENT_SECRET'),
        'redirect' => env('LINE_REDIRECT_URI'),
    ],

    'line_notify' => [
        'client_id' => env('LINE_NOTIFY_CLIENT_ID'),
        'client_secret' => env('LINE_NOTIFY_CLIENT_SECRET'),
        'redirect' => env('LINE_NOTIFY_REDIRECT_URI'),
    ],
];
