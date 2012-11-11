<?php
# Simple application to act as a proxy for requests from an iBook Author widget
# and forwarding these onto GoogleDocs.
# This is needed as we need to get around the cross-domain restriction of trying
# to call the GoogleDocs service directly from a widget (i.e. webpage) 
# embedded directly in an iBooks Author file being used in the iBooks app on an iPad.
#
# Expects:
# - service: the name of the service
# - query:   the querystring to be submitted to the service

# Process the incoming request
# e.g.
#   - service:  docs.google.com
#   - query:    formkey=dFR5SlItZWVhdGhTOWpUbmNSbWVrZFE6MQ&pageNumber=0&backupCache=&entry.0.single=&entry.1.single=test_location&entry.2.single=test_observation_1
$service = urldecode( isset($_GET['service']) ? $_GET['service'] : '' );
$query = urldecode( isset($_GET['query']) ? $_GET['query'] : '' );

switch($service) {
    case 'docs.google.com':
        $url = "https://docs.google.com/spreadsheet/formResponse?" . $query;
        $data = get_external($url);
        break; 
    default:
        $data = '';
}

# Return the response.
echo $data;

function get_external ($url) {
    $data = '';
    if ($url) {
        $ch = curl_init();
        curl_setopt_array($ch, array (
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_URL => $url,
            CURLOPT_HEADER => 0
        ));

        $data = curl_exec($ch);
        curl_close($ch);
    }

    return $data;
}