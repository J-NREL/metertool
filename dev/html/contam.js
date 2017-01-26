/* jshint laxcomma: true, undef: true */
/* global $, google */

/* requires: jQuery 1.4+ */
$(document).ready(function() {
    "use strict";

    // Handle visuals on the top tool bar
    $( '.controls' ).scrollToFixed({
        top: 0,
        preFixed:  function() { $(this).addClass('shadow'); },
        postFixed: function() { $(this).removeClass('shadow'); }
    });


    // Lots of global variables. Use carefully...
	// These are the charts
    var testchart, ICchart, ICPchart, Voltagechart, Leachingchart,
        chart1,
        chart2;

    var i;  // counter for number of files to load
    var index = 0;
    var cbHeaders  = ["manufacturer", "tradeName", "grade"];   // column headers that correspond to our select menu options
    var divMaterials = ["manufacturerDiv", "tradeNameDiv", "gradeDiv"];  // html divs to hold our select menus
    var materialClass = 0; // col B in csv
    var materialType  = 0;
    var datafilepath = './includes/data/';
    var fileList = ["assemblyAidsBasicDataWithICP.csv", "structuralMaterialsBasicData.csv", "hoseBasicData.csv"];
    var rawData = [];
    var globalIndex = 0;    // i think this is being used to track the material class selected in the dropdown
    var headers = [];

    // Charting styles
    var titleStyle = {
          color: '#008000'
        , fontSize: '12'
        , fontName: 'Verdana'
        , italic: false
    };

	

    google.load("visualization", "1", { packages:"corechart", callback: main });



    chart1 = new google.visualization.ScatterChart(document.getElementById('chart_div1'));
    chart2 = new google.visualization.ScatterChart(document.getElementById('chart_div2'));
	testchart = new google.visualization.LineChart(document.getElementById('chart_test'));

    var ic       = $('#chart-ic').get(0);
    var icp      = $('#chart-icp').get(0);
    var voltage  = $('#chart-voltage').get(0);
    var leaching = $('#chart-leaching').get(0);
	

    ICchart       = new google.visualization.ColumnChart( ic );
    ICPchart      = new google.visualization.ColumnChart( icp );
    Leachingchart = new google.visualization.ColumnChart( leaching );
    Voltagechart  = new google.visualization.ColumnChart( voltage );

    /*
     *
     * Helper function
     *  find unique members in an array
     */
    var unique2d = function(arr) {
        var i = 0,
            hash = {},
            result = [];

        for ( i ; i < arr.length; ++i ) {
            if ( !hash.hasOwnProperty( arr[i]) ) {
                hash[ arr[i] ] = true;
                result.push(arr[i]);
            }
        }
        return result;
    }

    /* Callback executed once the Google Charts library is loaded */
    function main(){

        /**
         * [processData -- parse a semi-colon delimited text file into a multidimensional array ]
         * @param  {[string]} rawtext   -- the input file
         * @param  {[number]} matType   -- array position to store data
         * @return {[none]}
         */
        var processData = function(rawtext, matType) {

            var rows,
                maxRows,
                maxColumns,
                colNumber,
                rowNumber,
                currentLine;

            rows = rawtext.split( /\r\n|\n|\r/ );   // split rows on whatever newline Excel mangles in there
            headers[matType] = rows[0].split(';');  // semi-colon sep value file

            maxColumns = headers[matType].length;
            rows.shift();  //remove headers
            rawData[matType] = new Array(maxColumns);

            maxRows = rows.length;

            for (colNumber=0; colNumber < maxColumns; colNumber++) {
                rawData[matType][colNumber] = new Array(maxRows);
            }

            for (rowNumber=0; rowNumber < maxRows; rowNumber++) {

                currentLine = rows[rowNumber].split(';');

                for (colNumber=0; colNumber < maxColumns; colNumber++) {
                    rawData[matType][colNumber][rowNumber] = currentLine[colNumber];
                }
            }
        };



        /*
         *  Create a select for Materials Class
         */
        var createMaterialClassMenu = function(matType) {

            var colClass  = headers[matType].indexOf( 'chemicalDescription' );
            var uniqChems = rawData[materialType][colClass].unique();
            var n = 0;
            var $option;
            var $select  = $('<select></select>', {'id': 'chemDescription'});
            var $thisDiv = $('#chemDescriptionDiv');

            $thisDiv.empty();


            // Build the <options>
            for (n ; n < uniqChems.length ; n++ ) {

                $option = $( '<option></option>' ).val( n ).html(  uniqChems[n] );
                $select.append( $option );

            }

            // Add the <select> menu, and event handlers for it
            $thisDiv.append( $select );
            $select.on( 'change', function(){
                filterDivs( index-1 )
            });
        };


        var filterDivs = function() {

            var i,
                col,
                initialRow,
                finalRow,
                $materialClassMenu;

            $materialClassMenu = $( '#chemDescription' );   // <select> menu
            materialClass = parseInt( $materialClassMenu.val() ) + 1;
            materialClass = materialClass.toString();

            col = headers[materialType].indexOf( "Class" );
            initialRow = rawData[materialType][col].indexOf( materialClass );
            finalRow   = rawData[materialType][col].lastIndexOf( materialClass  );

            for (i=0; i < cbHeaders.length; i++ ) {
                createMenu(i, divMaterials[i], cbHeaders[i], initialRow, finalRow, materialClass);
            }

            prepareCharts(0, materialClass);
        };

        /*
         *  Create select menus (for Manufacturers, Trade Name & Use, and Grade)
         */
        var createMenu = function(index, id, name, startIndex, endIndex, materialClass) {

            var colToLoad = headers[materialType].indexOf( cbHeaders[index] );
            var n = startIndex;
            var $option;
            var $select = $( '<select></select>' );
            var $thisDiv = $('#' + id );

            $thisDiv.empty();

            $select.attr( 'id', name );

            for (n; n <= endIndex; n++) {
                 $option = $( '<option></option>' )
                    .val( n-startIndex )
                    .html( rawData[materialType][colToLoad][n] );

                 $select.append( $option );

            }

            $thisDiv.append( $select );
            $select.on( 'change', function(){
                prepareCharts( index, materialClass );
            });

        };

        /**
         * prepareCharts
         * Event handler for when the user changes Manufacturer, Trade Name or Grade, select menus
         * Triggers redrawing all charts
         *
         * @param  {[number]} selectNum -- (0,1 or 2) -- which select menu was changed
         *
         */
        var prepareCharts = function( selectNum, materialClass ) {

            var $selectMenu = $( '#' + cbHeaders[ selectNum ] );
            var optionVal = $selectMenu.val();

            var classCol = headers[materialType].indexOf( "Class" );
            var classIndex = rawData[materialType][classCol].indexOf( materialClass );


            var i;
            var $otherSelect;

            for (i = 0; i < cbHeaders.length; i++ ) {
                if (i !== selectNum) {
                    $otherSelect = $('#' + cbHeaders[i] );
                    $otherSelect.val( optionVal );
                }
            }

            globalIndex = classIndex + parseInt( optionVal );
            drawAllCharts();
        };


        var drawAllCharts = function() {
            var leachingorder;  // the order of the columns in the Leaching chart
			
			drawTestChart();	
            drawChart1();
            drawChart2();
			
            addTable();

            drawICchart();
            drawICPchart();
            addInSituResults( '#insitu' );

            leachingorder = drawLeachingChart();
            drawVoltageChart( leachingorder ); // pass the order of the leaching data for the voltage chart
        };



        /*
         *
         * drawChart1
         * scatter plot of Total Anions [IC] and Total Concentration of Elements [ICP] in Leachate Solutions
         *
         */
        var drawChart1 = function() {

            var ICIndex  = headers[materialType].indexOf( 'IC_Anion_ppm' );
            var ICPIndex = headers[materialType].indexOf( 'ICPTotal_ppm' );
            var data     = new google.visualization.DataTable();
            var i, j, k, startIndex, stopIndex;

            var matIndex   = headers[materialType].indexOf( 'chemicalDescription' );
            var classIndex = headers[materialType].indexOf( 'Class' );
            var uClass     = rawData[materialType][classIndex].unique();
            var uMaterials = rawData[materialType][matIndex].unique();

            data.addColumn('number', 'X');
            for (i=0; i <= uMaterials.length-1; i++) {
                data.addColumn('number', uMaterials[i]);
            }

            var thisData = new Array( uClass.max );
            for (i=1; i <= uClass.length; i++) {
                startIndex = rawData[materialType][classIndex].indexOf(i+'');
                stopIndex  = rawData[materialType][classIndex].lastIndexOf(i+'');
                for (j=startIndex; j <= stopIndex; j++) {
                    for (k=0; k <= uClass.length; k++) {
                        if (k === 0) {
                            thisData[0] = parseFloat( rawData[materialType][ICPIndex][j] );
                        } else if (k==i) {
                            thisData[k] = parseFloat( rawData[materialType][ICIndex][j] );
                        } else {
                            thisData[k] = null;
                        }

                    }
                    data.addRow(thisData);
                }
            }

            // Create a special data series that corresponds to what's selected in the Material Class menu
            data.addColumn('number', 'This Material');
            var thisMatData = new Array( uClass.length + 1 );
            thisMatData[0]  = parseFloat(rawData[materialType][ICPIndex][globalIndex]);

            for (i=1; i <= uClass.length+1; i++) {

                if (i < uClass.length+1) {
                    thisMatData[i]=null;
                } else {
                    thisMatData[i] = parseFloat( rawData[materialType][ICIndex][globalIndex] );
                }

            }

            data.addRow(thisMatData);


            var options = {
                  titlePosition: 'out'
                , hAxis: {title: "ICP Total(ppm)", titleTextStyle: titleStyle}
                , vAxis: {title: "IC Total (ppm)", titleTextStyle: titleStyle}
                , legend: {position: 'right', alignment: 'center'}
                , chartArea: {width: '50%'}
                , width: 445
                , series: {}
            };

            var highlightSeriesIndex=uClass.length;
            options.series[highlightSeriesIndex] = { color: '#00cc00', pointSize:19};

            chart1.draw(data, options);

        };

		/* draw test chart
		* Box interval graph
		*
		*/
		
		<script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
		<script type="text/javascript">
		google.charts.load('current', {'packages':['corechart']});
		google.charts.setOnLoadCallback(drawChart);

		function drawTestChart() {
			var data = new google.visualization.DataTable();
			data.addColumn('number', 'x');
			data.addColumn('number', 'values');
			data.addColumn({id:'i0', type:'number', role:'interval'});
			data.addColumn({id:'i1', type:'number', role:'interval'});
			data.addColumn({id:'i2', type:'number', role:'interval'});
			data.addColumn({id:'i2', type:'number', role:'interval'});
			data.addColumn({id:'i2', type:'number', role:'interval'});
			data.addColumn({id:'i2', type:'number', role:'interval'});
  
			data.addRows([
				[1, 100, 90, 110, 85, 96, 104, 120],
				[2, 120, 95, 130, 90, 113, 124, 140],
				[3, 130, 105, 140, 100, 117, 133, 139],
				[4, 90, 85, 95, 85, 88, 92, 95],
				[5, 70, 74, 63, 67, 69, 70, 72],
				[6, 30, 39, 22, 21, 28, 34, 40],
				[7, 80, 77, 83, 70, 77, 85, 90],
				[8, 100, 90, 110, 85, 95, 102, 110]]);
  
			// The intervals data as narrow lines (useful for showing raw source data)
			var options_bars = {
				title: 'Line intervals, default',
				curveType: 'function',
				lineWidth: 4,
				intervals: { 'style':'boxes' },
				legend: 'none'
			
			testchart.draw(dataTable, options);
        };
		

        /*
         *
         * drawChart2
         * scatter plot of Quantity of Ions and Organics in Leachate Solutions
         *
         */
        var drawChart2 = function() {
            var classIndex = headers[materialType].indexOf( 'Class' );
            var startIndex = rawData[materialType][classIndex].indexOf(materialClass+'');
            var endIndex   = rawData[materialType][classIndex].lastIndexOf(materialClass+'');
            var TOCIndex   = headers[materialType].indexOf( 'TOC' );
            var condIndex  = headers[materialType].indexOf( 'conductivity_uSPerCm' );
            var a;
            var data = [];
            var dataTable;
			/* retrieving the data for the chart */
            data[0] = ['TOC(ppm)', 'Materials in this Class'];

            for ( a = startIndex; a <= endIndex; a++) {

                data.push([
                     parseFloat(rawData[materialType][TOCIndex][a])
                    ,parseFloat(rawData[materialType][condIndex][a])
                ]);
            }

            dataTable = google.visualization.arrayToDataTable(data);

            dataTable.addColumn('number', 'This Material');

            dataTable.addRow([
                 parseFloat(rawData[materialType][TOCIndex][globalIndex])
                ,null
                ,parseFloat(rawData[materialType][condIndex][globalIndex])
            ]);

            var options = {
                  hAxis:  {title: 'Total Organic Carbon (ppm)', titleTextStyle: titleStyle}
                , vAxis:  {title: 'Conductivity (uS/cm)',       titleTextStyle: titleStyle}
                , legend: {position: 'top', alignment: 'center'}
                , colors: ['blue', '#00cc00']
                , width:  445
            };

            chart2.draw(dataTable, options);

        };


        /*
         *
         *
         * bar chart of Identity and Quantity of Anions in Leachate Solutions [IC]
         *
         */
        var drawICchart = function() {

            var analyteStartCol = headers[materialType].indexOf("F");
            var analyteEndCol   = headers[materialType].indexOf("SO4");
            var data = [],
                a,
                options,
                dataTable;

            for (a=analyteStartCol; a <= analyteEndCol; a=a+1) {
                data.push([ headers[materialType][a], parseFloat( rawData[materialType][a][globalIndex] ) ])

            }

            dataTable = google.visualization.arrayToDataTable( data, true );

            options = {
                  hAxis: {title: 'Anion',               titleTextStyle: titleStyle}
                , vAxis: {title: 'Concentration (ppm)', titleTextStyle: titleStyle}
                , chartArea: { width:355}
                , legend: 'none'
                , width: 455
            };

            ICchart.draw(dataTable, options);
        };


        /*
         *
         *
         * bar chart of Identity and Quantity of Top 6 Elements by Concentration [ICP]
         *
         */
        var drawICPchart = function() {

            var analyteStartCol = headers[materialType].indexOf("ICPTotal_ppm") + 1; // start after ICPTotal_ppm
            var analyteEndCol   = headers[materialType].indexOf("numPeaks_GCMS");  // end at numPeaks_GCMS
            var data = [],
                a,
                topData;


            for (a=analyteStartCol; a < analyteEndCol; a=a+1) {

                data.push([ headers[materialType][a], parseFloat(rawData[materialType][a][globalIndex]) ]);

            }


            //sort the data by the largest species, return only the top 6
            // (NB: NaN values will fail here in most browers)
            data.sort(function(a,b){
                return b[1] - a[1];
            });


            topData = data.slice(0,6);
            //console.log('topData:', topData)

            var dataTable = google.visualization.arrayToDataTable(topData, true);

            var options = {
                  hAxis: {title: 'Element',            titleTextStyle: titleStyle}
                , vAxis: {title: 'Concentration (ppm)',titleTextStyle: titleStyle}
                , legend: 'none'
                , width: 445
            };

            ICPchart.draw( dataTable, options );
        };


        /*
         * moakley
         * add the graphic in the in situ data box
         *
         */
        var addInSituResults = function( target ) {
            var dir,
                imgsrc,
                html;

            if( !target ) return false

            switch(materialType)
            {
                case 0:
                    dir     = 'assy';
                    imgsrc  = './images/' + dir + '/class' + materialClass + '.jpg';
                    html    = $( '<img>', { src: imgsrc, width: 459 });
                    break;
                case 1:
                    dir     = 'struct';
                    imgsrc  = './images/' + dir + '/class' + materialClass + '.jpg';
                    html    = $( '<img>', { src: imgsrc, width: 459 });
                    break;
                case 2:     /* hose data */
                    html    = '<div class="alertbox"><h3>Data not available</h3></div>';
            }

            $( target ).empty().append( html );

            return true;
        };


        /*
         *
         * add the GCMS info
         *
         */
        var addTable = function() {

            var indPeak,
                $header = $('#tableHeader'),
                i = 1,
                lastDiv = 5,
                $div,
                colPeaks = headers[materialType].indexOf('numPeaks_GCMS'),
                colWeeks = headers[materialType].indexOf('weeksSoaked');

            if (materialType === 0) {
                $header.html("<h2>GCMS Summary: Top 4 Organic Compounds by Concentration as Identified by NIST Search</h2>");
            } else {
                $header.html("<h2>GCMS/LCMS Results</h2>");
            }

            $header.append('<p>Total number of peaks detected: '+ rawData[materialType][colPeaks][globalIndex] + '<br>Weeks soaked: '+ rawData[materialType][colWeeks][globalIndex] + '</p>');

            for ( i; i<lastDiv; i++) {
                    $div = $("#table"+i);
                    indPeak=headers[materialType].indexOf("peak1");
                    $div.html( rawData[materialType][indPeak+i-1][globalIndex] );
            }
        };




        /*
         * moakley
         *
         * bar chart of Leaching data
         *
         */
        var drawLeachingChart = function() {

            var axisLabelCol,       // column number in the data for the x axis
                leachingIndexCol,   // column number in the data for the y axis
                data,               // array of arrays of data
                numRows,            // number of rows of data in the CSV
                i,                  // counter
                options,            // charting styles
                sortorder,          // return; order of data for other charts to sort on
                axislabel,          // string from CSV; corresponds to x axis label
                dataTable,          // dataTable object for google
                dtrownum,           // row number in the dataTable
                dtrowval;           // data in dataTable row

            if( materialType === 2 ) { // No hose data
                $('#chart-leaching').hide()
                $('#chart-leaching + .alertbox').show()
                return false;
            } else {
                $('#chart-leaching + .alertbox').hide()
                $('#chart-leaching').show()
            }

            axisLabelCol     = headers[materialType].indexOf("axisLabel");
            leachingIndexCol = headers[materialType].indexOf("leachingIndex");

            data = [];
            numRows  = rawData[ materialType ][ axisLabelCol ].length;

            // Pull out our data from the CSV
            for( i = 0 ; i < numRows ; i=i+1 ) {
                data.push([
                      rawData[ materialType ][ axisLabelCol ][ i ]
                    , parseFloat(rawData[ materialType ][ leachingIndexCol ][ i ])
                ]);
            }

            // Sort the data based on leaching so we can show an increasing bar chart (small on left, large on right)
            data.sort(function(a, b) {
                return a[1] > b[1] ? 1 : -1;
            });

            data = unique2d( data );
            dataTable = google.visualization.arrayToDataTable( data, true );

            /*
             * To style a column in the ColumnChart we need the data in its own series.
             * To create a new series, just add a column to the dataTable object.
             * Steps:
             *      Find the current material name in the axisLabel CSV column
             *      Find where that label exists in our dataTable
             *      Shift the data from the existing dataTable data column to a new column
             */

            axislabel = rawData[materialType][axisLabelCol][globalIndex]; // get the text label to search on

            // get the row where our current data is
            dtrownum = parseInt( dataTable.getFilteredRows([{column: 0, value: axislabel }]) );

            dataTable.addColumn('number','');
            dtrowval = dataTable.getValue(dtrownum,1)
            dataTable.setValue(dtrownum,1, 0)
            dataTable.setValue(dtrownum,2, dtrowval)

            // Chart style options
            options = {
                  hAxis: {  title: 'Material Class', titleTextStyle: titleStyle, slantedTextAngle: 45}
                , vAxis: {  title: 'Leaching Index', titleTextStyle: titleStyle}
                , legend: 'none'
                , chartArea: { height: 200, width: 345, left:75, top:50 }
                , height:375
                , width: 445
                , isStacked: true
                , series: [{color: '#3366CC', visibleInLegend: false}, {color: '#00cc00', visibleInLegend: false}]
            };



            // Draw the chart
            Leachingchart.draw( dataTable, options );

            sortorder = [];

            // get the first value from each item in our array of arrays
            data.forEach( function( item, idx ){
                sortorder[idx] = item[0];
            });

            return sortorder;
        };


        /**
         * moakley
         * [drawVoltageChart -- bar chart of Voltage Loss]
         * @param  {[array]} order  --  array of strings to sort on
         * @return {[type]}
         */
        var drawVoltageChart = function( order ) {

            var axisLabelCol,       // column number in the data for the x axis
                voltageLossCol,     // column number in the data for the y axis
                numRows,            // number of rows of data in the CSV
                i,                  // counter
                options,            // chart style options
                data,               // array of arrays of data
                result,             // array of data after some sorting
                axislabel,          // string from CSV; corresponds to x axis label
                dataTable,          // dataTable object for google
                dtrownum,           // row number in the dataTable
                dtrowval;           // data in dataTable row

            if( materialType === 2 ) { // No hose data
                $('#chart-voltage').hide()
                $('#chart-voltage + .alertbox').show()
                return
            } else {
                $('#chart-voltage + .alertbox').hide()
                $('#chart-voltage').show()
            }

            axisLabelCol   = headers[materialType].indexOf("axisLabel");
            voltageLossCol = headers[materialType].indexOf("voltageLoss");

            data = [];
            numRows = rawData[ materialType ][ axisLabelCol ].length;

            // Pull out our data from the CSV
            for( i = 0 ; i < numRows ; i=i+1 ) {
                data[ i ] = [ rawData[ materialType ][ axisLabelCol ][ i ], parseFloat(rawData[ materialType ][ voltageLossCol ][ i ]) ];
            }

            // Sort based on material, then
            data.sort( function(a, b) {
                return a[1] > b[1] ? 1 : -1;
            });

            data = unique2d( data );
            result = [];

            // map our data back to the order of the order array, but add an index n
            // sort based on index n
            // return our original data without the n
            result = data.map( function(item) {
                    var n = order.indexOf( item[0] );
                    order[n] = '';
                    return [n, item]
                })
                .sort( function(a, b){
                    return a[0] > b[0] ? 1 : -1;
                })
                .map( function(j) {
                    return j[1]
                });


            dataTable = google.visualization.arrayToDataTable( result, true );

            /*
             * To style a column in the ColumnChart we need the data in its own series.
             * To create a new series, just add a column to the dataTable object.
             * Steps:
             *      Find the current material name in the axisLabel CSV column
             *      Find where that label exists in our dataTable
             *      Shift the data from the existing dataTable data column to a new column
             */

            axislabel = rawData[materialType][axisLabelCol][globalIndex]; // get the text label to search on

            // get the row where our current data is
            dtrownum = parseInt( dataTable.getFilteredRows([{column: 0, value: axislabel }]) );

            dataTable.addColumn('number','');
            dtrowval = dataTable.getValue(dtrownum,1)
            dataTable.setValue(dtrownum,1, 0)
            dataTable.setValue(dtrownum,2, dtrowval)

            options = {
                  hAxis: {  title: 'Material Class',    titleTextStyle: titleStyle, slantedTextAngle: 45}
                , vAxis: {  title: 'Voltage Loss (mV)', titleTextStyle: titleStyle}
                , legend: 'none'
                , chartArea: { height: 200, width:365, left:75, top:50  }
                , height: 375
                , width:  445
                , isStacked: true
                , series: [{color: '#3366CC', visibleInLegend: false}, {color: '#00cc00', visibleInLegend: false}]
            };

            Voltagechart.draw(dataTable, options);
        };



        // event handler for Material Type select menu
        $( '#material_type' ).on( 'change', function(){
            materialType = parseInt( $(this).val() );

            createMaterialClassMenu(materialType);
            filterDivs(materialType);
        });


        // Get the data files
        var loadFile = function(filename, matType) {

            var def = $.ajax({
                 type     : 'GET'
                ,url      : datafilepath + filename
                ,dataType : 'text'
            });

            // Set up the initial page view
            def.done(function(data){
                processData( data, matType );

                if (matType === 0) {
                    createMaterialClassMenu( matType );
                    filterDivs( matType );
                }
            });

            def.fail(function(){
                console.error("There was a problem loading: "+ filename);
            });
        };


        // kick everything off by loading all the files.
        fileList.forEach( function( file, idx ){
            loadFile(file, idx)
        });

        // for(i=0; i < fileList.length; i++) {
        //     loadFile( fileList[i], i );
        // }


    } // main()
}); // ready()

