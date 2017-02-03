<html>
<head>
	<script
		src="https://code.jquery.com/jquery-2.2.4.js"
		integrity="sha256-iT6Q9iMJYuQiMWNd9lDyBUStIq/8PuOW33aOqmvFpqI="
		crossorigin="anonymous">
	</script>
    <script src="scripts/mcd.ajax.js"></script>
    <script>
        $(function() {
//            $.get( "/data", function( data ) {
//                $( "#data" ).html( data );
//            });
            _loadData();
        });

        var _loadData = function () {
            MCD.ajax.get("/data", {
                success: function (data) {
                    $( "#data" ).html( data.responseText );
                },
                error: function () {
                    alert("ERROE");
                }
            });
        };
    </script>
</head>
<body>
	<h1>${message}</h1>
    <span id="data"></span>
</body>
</html>