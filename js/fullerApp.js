var machineLines = [
					'PRESTRETCH 1 (38.1)',
					'PRESTRETCH 2 (43.8)',
					'PRESTRETCH 3 (38.1)',
					'PRESTRETCH 4 (43.8)',
					'PRESTRETCH 5 (38.1)',
					'PRESTRETCH 6 (45.7)',
					'PRESTRETCH 7 (VXX)',
					'PRESTRETCH 8 (38.1)',
					'PRESTRETCH 9 (40.6-38.1-43.8)',
					'PRESTRETCH 10 (38.1)',
					'PRESTRETCH 11 (40.6, 38.1)',
					'PRESTRETCH 12 (30.5-33.0)',
					'PRESTRETCH 13 (38.1)',
					'PRESTRETCH 14 (38.1)',
					'PRESTRETCH 15 (38.1)',
					'PRESTRETCH 16 (VXW)',
					'PRESTRETCH 17 (38.1)',
					'PRESTRETCH 18 (43.8)',
					'PRESTRETCH 19 (38.1)',
					'SLITTER 1 (5")',
					'SLITTER 2 (3")',
					'SLITTER 3 (3")',
					'SLITTER 4 (EXTCORE)',
					'SLITTER 5 (5")',
				];
				
var app = angular.module("app", []);
app.factory("overviewService", function($http) {
  var service = {};
  var gUrl = "https://script.google.com/macros/s/AKfycbzHwv9vQIZh22a-WNuM-yTrYZ3nINvaMY70f1Z8cvI0X7lTt0jr/exec?user=wayne&sheet=";

  service.getAllOrders = function() {
    return $http.get(gUrl + "Schedule");
  };

  return service;
});

app.directive('autoComplete', function($timeout) {
    return function(scope, iElement, iAttrs) {
            iElement.autocomplete({
                source: scope[iAttrs.uiItems],
                select: function() {
                    $timeout(function() {
                      iElement.trigger('input');
                    }, 0);
                }
            });
    };
}).controller("overviewController", [ "$scope","$log","$interval","$timeout","$http","$filter","overviewService",
	
	function($scope, $log, $interval, $timeout, $http, $filter, overviewService) {
		var init = function() {
			$scope.loading = true;
			$scope.rendered = false;
			$scope.schedule;
			$scope.linen = machineLines[0];
			$scope.productId;
			$scope.user = localStorage.shift;
			
			$scope.getOrders = function(){
				overviewService.getAllOrders().then(
					function successCallback(response) {
						$scope.schedule =  response.data.records;	
							$scope.loading = false;			
					},
					function errorCallback(response) {
						$log.log("Error");
					}
				);		  
			};
	  
			$scope.machineLine = machineLines;  
			
			$scope.$watch('schedule', function(newValue, oldValue, scope) {
				return $scope.schedule;
			}, true);
			
			$scope.getOrders();
					
			$interval(function() {$scope.getOrders();}, 60 * 1000); 
			
			$scope.populateJO = function(data) {
				$scope.currentOrder = data;				
				var modal = document.getElementById("jobOrderModal");
				modal.style.display = "block";
			};
					
				
			
			$scope.printBC = function(skidnumber,prodid,qty){			
									
				if(skidnumber.length > 0){
					
					printBarcode(skidnumber,prodid,qty);
					
				}else{
					
					$scope.productId = prodid;
					var modal = document.getElementById('skidTagPrint');
					$('.bc-form input').val('');
					modal.style.display = "block";					
				}		
			
			};
			
			
			$scope.printBarcodeOverwrite = function(idfrom,idto,prodid){
				
				if(idfrom == undefined && idto == undefined){
					alert('Please enter barcode ids to print...');
					
				}else{
					var count = (parseInt(idto) - parseInt(idfrom)) + 1;
					var start = parseInt(idfrom);
					var skidnumber = new Array();
					for(var i=0;i<count;i++){
						
						skidnumber.push(start + i);
					}			
					
					//console.log(skidnumber.join(','));
					printBarcode(skidnumber.join(','),prodid,count);
				}				
			};
			
			
			//printLabel(x.CUSTOMERNAME,x.PRODUCT_DESCRIPTION,x.SKID_QTY,x.UOM,x.ORDER_PO_NUMBER,)
			$scope.printLabel = function(custname,proddesc,noOfskids,qty,uom,ponum,productid){
				$('#printLabel').html('');
				var  htmlContent ='';
				
				if(proddesc == undefined || proddesc == ''){
					proddesc = productDescription[productid];
				}
				var test = proddesc.slice(0, proddesc.lastIndexOf('('));
				
							
				var p = test.substring(test.indexOf('('),test.indexOf(')')+1); //remove second ();
				
				var pp = test.substring(0,test.indexOf('FILM') + 4);
				
				if(test.indexOf('FILM') <= -1){
					pp = test.substring(0,test.indexOf('CORE') + 4);
				}
				
				var ppp = test.replace(p,"").replace(pp,"").replace(/#PLBL/g,"").replace(/#1INCORE/g,"").replace(/STD/g,"");
				
				for(var i=0;i<noOfskids;i++){										
					
					htmlContent += '<div class="container">'+
						'<div class="costumer">'+
						'<h1 class="'+((custname.indexOf('STOCK') > -1) ? "stock" : "underlined")+'">'+custname+'</h1>'+
						'</div>'+
						'<div class="product">'+
						'<p>'+ppp+'</p>'+
						'<p>'+pp+'</p>'+
						'</div>'+
						'<div class="po">'+
						'<p>P.O.# '+ponum+'</p>'+
						'</div>'+
						'<div class="made">'+
						'<div>'+
						'<p class="qty">'+(qty/noOfskids) +' '+ uom +'S/SKID</p>'+
						'<p class="madeincanada">MADE IN CANADA</p>'+
						'</div>'+
						'<div class="counter">'+
						'<span>'+(i+1)+'</span>'+
						'<span>'+noOfskids+'</span>'+
						'</div>'+
						'</div>'+
						'</div>';
				}	
					$('#printLabel').append(htmlContent);
					
					setTimeout(function(){	
		
						$('#printLabel').printElem('skidLabel',0,0,localStorage.shift,""); 	
							
					},800);			
			};
			
			//autocomplete			
			$scope.datalist = productList;					
	  };
	  init();
	}	
]);

function printBarcode(skidnumber,prodid,qty){
	var noOfCopies = 0;
	var orderNumber = '';	
	$('#printSkids').html('');	
	var skidIDs = new Array();
		skidIDs = (skidnumber.split(',')).filter((v, i, a) => a.indexOf(v) === i);
		
	var totalSkids = (skidIDs.length > qty) ? skidIDs.length : qty;	
		for(var i=0;i<totalSkids;i++){					
						
			htmlContent = '<div class="bc-div" style="width: 100%;display:block;">'+
							'<p class="bcodelabel" style="width:100%;">'+
								'<span style="float:left;margin-left:5px;">'+skidIDs[i]+'</span>'+
								'<span style="float:right;margin-right:-58px;">'+prodid.replace(/-/g,"")+'</span>'+
							'</p>'+
							'<img class="barcode'+skidIDs[i]+' barcode" style="display:block;margin:0 auto;width:110%;position:relative;top:-8px;"/>'+
							'<p style="width:100%;text-align:center;margin: 10px 0 0 50px;color: #000;font-size: 32px;line-height: 1.25rem;font-family: arial;font-weight: 400;">MADE IN CANADA</p>'+
							'<p style="width:100%;text-align:right;margin-top:230px;color: #000;font-size:40px;font-family: arial;font-weight:700;margin-bottom:0;">'+
								(i + 1)+' of '+ totalSkids +'</p>'+
							'</div>';				  
								
							
			$('#printSkids').append(htmlContent);

				JsBarcode(".barcode"+skidIDs[i], skidIDs[i], 
							{
								format: "code39",
								font: "arial",
								fontSize: 35,
								textMargin: 0,
								text: skidIDs[i],
								width: 10,
								height: 250,
								displayValue: false	
							});							
		}
			noOfCopies = skidIDs.length;

			setTimeout(function(){$('#printSkids').printElem('skidTags',noOfCopies,orderNumber,localStorage.shift,"skidTagPrint")},1000);
	
}


jQuery.fn.extend({
 printElem: function(a,b,c,d,e) {
  var cloned = this.clone();
  var printSection = $('#printSection');
  if (printSection.length == 0) {
   printSection = $('<div id="printSection" class="container"></div>');
   $('body').append(printSection);
  }
  printSection.append(cloned);
  var toggleBody = $('body *:visible');
  toggleBody.hide();
  $('#printSection, #printSection *').show();
  
  //append css
  
	var css = '@page { size: 8.5in 11in;margin:15mm 15mm;}body{color:#000!important;width:785px;height: 980px;page-break-after: avoid;page-break-before: avoid;}.container.job-order-form{width:130%!important;display:block;}.recipe{margin: 0px auto;}',
    head = document.head || document.getElementsByTagName('head')[0],
    style = document.createElement('style');
	 
	 if(a == 'skidTags'){ 
		css = '@page { size: 11in 8.5in; margin-top: 5.5cm;}body{width:920px;height: 600px;}';
	 }else if(a == 'skidLabel'){
		 css = '@page { size: 11in 8.5in;margin:10mm 15mm;}body{width:980px;height: auto;color:#000;font-family:"Times New Roman"!important;}'+
				'.container *{margin:0;padding:0;}.container{width:100%;font-weight:600;text-align:center;padding:15px 0 0;margin:0;page-break-inside:avoid;}'+
				'.costumer{margin-bottom: 25px;}h1{font-size:80px;line-height:1;text-transform:uppercase;font-weight:700;}'+
				'.product p{font-size:75px;line-height:1;margin-bottom: 10px;}.po p{font-size:75px;}.made{position:relative;}.made .qty{font-size: 65px;line-height:1;}'+
				'.made .madeincanada{font-size: 40px;margin-top:-15px;}.made .counter{position:absolute;right: -40px;top: -50px;}'+
				'.counter span{display:block;padding:10px 50px;font-size:50px;border:1px solid #000;}.counter span+span{margin-top:-1px;}'+
				'.underlined{text-decoration: underline;}';
	 }

	style.type = 'text/css';
	style.media = 'print';

	if (style.styleSheet){
	  style.styleSheet.cssText = css;
	} else {
	  style.appendChild(document.createTextNode(css));
	  
	} 
	
	head.appendChild(style);  
	window.print();  
	printSection.remove();  
	toggleBody.show();
  
	window.onafterprint = function(event) { 
	//console.log("done");
	if(a == 'skidTags'){
		//logPrint(a,b,c,d,e);	
	}		
	};
	
	//var modal = document.getElementById("skidTagPrint");
		//modal.style.display = "none";	
  
 }

});






// Get the modal
var modal = document.getElementById("myModal");

var btn = document.getElementById("myBtn");

var span = document.getElementsByClassName("close")[0];

function showModal(ele){
	var modal = document.getElementById(ele);
	modal.style.display = "block";
}

	function closeModal(ele) {
		var modal = document.getElementById(ele);
		modal.style.display = "none";
		$('.reset').val('');
		
	}
	
	function windowOnClick(event) {
		var ele = event.target.id;
		//alert(ele);
		event.preventDefault();
		if(ele == 'jobOrderModal' || ele == 'skidTagPrint' || ele == 'scheduleModal' || ele == 'printLabelBarcode' || ele == 'printLabelTags'){				
				closeModal(ele);
		}
		
		
	}
	window.addEventListener("click", windowOnClick);
