import { Component, NgZone, OnInit } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import { NotifierService } from 'angular-notifier';

declare const annyang: any;
//declare const responsiveVoice: any;
declare var tableau: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
	graphHeaderText = "";
	isFiltered:boolean = false;
	readonly monthList = ['January','February','March','April','May','June','July','August','September','October','November','December'];
	viz: any;
	viz1:any;
	viz2: any;
	workbook: any;
	activeSheet: any
	voiceActiveSectionDisabled: boolean = true;
	voiceActiveSectionError: boolean = false;
	voiceActiveSectionSuccess: boolean = false;
	voiceActiveSectionListening: boolean = false;
	voiceText: any;
	showGraph = true;

  constructor(private ngZone: NgZone, public notifier: NotifierService){}

  ngOnInit(): void {
	let loaderDiv = document.getElementById('loaderDiv');
	loaderDiv?.classList.add("hideLoader");
  }

	initializeVoiceRecognitionCallback(): void {
		annyang.addCallback('error', (err:any) => {
      if(err.error === 'network'){
        this.voiceText = "Internet is require";
        annyang.abort();
        this.ngZone.run(() => this.voiceActiveSectionSuccess = true);
      } else if (this.voiceText === undefined) {
				this.ngZone.run(() => this.voiceActiveSectionError = true);
				annyang.abort();
			}
		});

		annyang.addCallback('soundstart', (res:any) => {
      this.ngZone.run(() => this.voiceActiveSectionListening = true);
		});

		annyang.addCallback('end', () => {
      if (this.voiceText === undefined) {
        this.ngZone.run(() => this.voiceActiveSectionError = true);
				annyang.abort();
			}
		});

		annyang.addCallback('result', (userSaid:any) => {
			this.ngZone.run(() => this.voiceActiveSectionError = false);

			let queryText: any = userSaid[0];

			annyang.abort();

      this.voiceText = queryText;

			this.ngZone.run(() => this.voiceActiveSectionListening = false);
      this.ngZone.run(() => this.voiceActiveSectionSuccess = true);
		});
	}

	startVoiceRecognition(): void {
    	this.voiceActiveSectionDisabled = false;
		this.voiceActiveSectionError = false;
		this.voiceActiveSectionSuccess = false;
    	this.voiceText = undefined;
		if (annyang) {
			
			annyang.addCallback('result', (userSaid:any) => {
				console.log("user said",userSaid);
				this.createCommands(userSaid[0]);
			});

      this.initializeVoiceRecognitionCallback();

			annyang.start({ autoRestart: false });
			console.log("voice text", this.voiceText);
		}
	}

	getLastNMonths(numberOfLastMonths:any){
		var today = new Date();
		var d;
		var prevMonth;
		var month;
		var mdyObj = {m1:0,m2:0,d1:0,d2:0,y1:0,y2:0};

		d = new Date();
		prevMonth = d.setMonth(d.getMonth() - numberOfLastMonths);
		mdyObj.d1 = d.getDate();
		mdyObj.m1 = d.getMonth();
		mdyObj.y1 = d.getFullYear();
		
		mdyObj.d2 = today.getDate();
		mdyObj.m2 = today.getMonth();
		mdyObj.y2 = today.getFullYear();

	  	return mdyObj;
	}

	getFiltersForBusyPeriod(instruction:string){
		let commandArray = instruction.split(" ");
		let monthCount = 0;
		let url = "https://public.tableau.com/views/Q4_16474316992850/Sheet1?:language=en-GB&:display_count=n&:origin=viz_share_link";
		let monthIndex = commandArray.indexOf("months") - 1;

		if(monthIndex < 0){
			monthIndex = commandArray.indexOf("month") - 1;
		}

		if(monthIndex > 0){
			if(commandArray[monthIndex] == "last"){
				monthCount = 1;
			}
			else{
				monthCount = Number(commandArray[monthIndex]);
			}

			let indexOfIn = commandArray.lastIndexOf("in");
			let buildingName =  this.retrieveName(indexOfIn,commandArray.length,commandArray);

			return {month:monthCount,tenant:"",visitor:"",url: url,building:buildingName};
		}
		return {};
	}

	getFiltersForFirstTimeRepeatedCase(instruction:string){
		let commandArray = instruction.split(" ");
		let tenantName = "";
		let monthCount = 0;
		let url = "https://public.tableau.com/views/Q3_16473531887730/Sheet2?:language=en-GB&publish=yes&:display_count=n&:origin=viz_share_link";

		let monthIndex = commandArray.indexOf("months") - 1;

		if(monthIndex < 0){
			monthIndex = commandArray.indexOf("month") - 1;
		}

		if(commandArray[monthIndex] == "last"){
			monthCount = 1;
		}
		else{
			monthCount = Number(commandArray[monthIndex]);
		}
		let indexOfFor = commandArray.indexOf("for");
		let indexOfIn = commandArray.indexOf("in");
		tenantName =  this.retrieveName(indexOfFor,indexOfIn,commandArray);

		return {month:monthCount,tenant:tenantName,visitor:"",url: url,building:""};
	}

	getFiltersForRestrictedCase(instruction:string){
		let commandArray = instruction.split(" ");
		let tenantName = "";
		let monthCount = 0;
		let url = "https://public.tableau.com/views/Q2_16473529118670/Sheet1?:language=en-GB&publish=yes&:display_count=n&:origin=viz_share_link";
		let monthIndex = commandArray.indexOf("months") - 1;

		if(monthIndex < 0){
			monthIndex = commandArray.indexOf("month") - 1;
		}
		if(monthIndex > 0){
			if(commandArray[monthIndex] == "last"){
				monthCount = 1;
			}
			else{
				monthCount = Number(commandArray[monthIndex]);
			}
		}
		let indexOfFor = commandArray.indexOf("for");
		let indexOfIn = commandArray.indexOf("in");
		tenantName =  this.retrieveName(indexOfFor,indexOfIn,commandArray);

		return {month:monthCount,tenant:tenantName,visitor:"",url: url,building:""};

	}

	getFiltersForParticularVisitorCase(instruction:string){
		let commandArray = instruction.split(" ");
		let monthCount = 0;
		let visitorName = "";
		let tenantName = "";
		let peopleCount = 0;
		if(instruction.includes("often") || instruction.includes("visited")){
			this.graphHeaderText = "Visitor's count of visiting a Company";
			let monthIndex = commandArray.indexOf("months") - 1;
			if(monthIndex < 0){
				monthIndex = commandArray.indexOf("month") - 1;
			}
			let url = "https://public.tableau.com/views/Query1a_16473521550120/HowoftenavisitorvisitedatenantinlastXmonths?:language=en-GB&publish=yes&:display_count=n&:origin=viz_share_link";
			if(monthIndex > 0){
				if(commandArray[monthIndex] == "last"){
					monthCount = 1;
				}
				else{
					monthCount = Number(commandArray[monthIndex]);
				}
			}
			let indexOfOften = commandArray.indexOf("often");
			let indexOfVisited = commandArray.indexOf("visited");
			let indexOfIn = commandArray.indexOf("in");
			visitorName =  this.retrieveName(indexOfOften,indexOfVisited,commandArray).toUpperCase();
			tenantName = this.retrieveName(indexOfVisited,indexOfIn,commandArray);

			return {month:monthCount, visitor: visitorName, tenant:tenantName , url: url,building:""};
		}
		else if(instruction.includes("meet") && instruction.includes("whom")){
			this.graphHeaderText = "Host wise Visitor's visit count";
			let monthIndex = commandArray.indexOf("months") - 1;
			if(monthIndex < 0){
				monthIndex = commandArray.indexOf("month") - 1;
			}
			let url = "https://public.tableau.com/views/Quey1b_16473525252880/CanyoushowmethevisitorcametomeetwhominlastXmonths?:language=en-GB&publish=yes&:display_count=n&:origin=viz_share_link";
			if(monthIndex > 0){
				if(commandArray[monthIndex] == "last"){
					monthCount = 1;
				}
				else{
					monthCount = Number(commandArray[monthIndex]);
				}
			}
			let indexOfMe = commandArray.indexOf("me");
			let indexOfCame = commandArray.indexOf("came");
			let indexOfIn = commandArray.lastIndexOf("in");
			visitorName =  this.retrieveName(indexOfMe,indexOfCame,commandArray).toUpperCase();
			tenantName = this.retrieveName(indexOfIn,commandArray.length,commandArray);
			return {month:monthCount, visitor: visitorName , url: url, tenant:tenantName,building:""};
		}
		else{
			this.graphHeaderText = "";
			return {};
		}
	}

	retrieveName(startingIndex:any, endingIndex:any, commandArray:any){
		let name = ""; 
		for(let i = startingIndex+1; i < endingIndex ; i++){
			name = name + commandArray[i] + " ";
		}
		return name.trim().toLowerCase();
	}

	createCommands(instruction:any){
		if(instruction.includes("often") || instruction.includes("meet")){
			let filterParams = this.getFiltersForParticularVisitorCase(instruction);
			this.createGraph(filterParams);
		}
		else if(instruction.includes("restricted")){
			let filterParams = this.getFiltersForRestrictedCase(instruction);
			this.createGraph(filterParams);
			this.graphHeaderText = "Restricted visitors count";
		} 
		else if(instruction.includes("repeat") || instruction.includes("repeated")){
			let filterParams = this.getFiltersForFirstTimeRepeatedCase(instruction);
			this.createGraph(filterParams);
			this.graphHeaderText = "First time and repeated visitors for a company";
		}

		else if(instruction.includes("hour") && instruction.includes("building")){
			let filterParams = this.getFiltersForBusyPeriod(instruction);
			this.createGraph(filterParams);
			this.graphHeaderText = "Busy period for a building";
		}

		else{
			this.graphHeaderText = "";
			this.showNotification("info","Data not available for provided command");
		}
	}

	closeVoiceRecognition(): void {
		this.voiceActiveSectionDisabled = true;
			this.voiceActiveSectionError = false;
			this.voiceActiveSectionSuccess = false;
			this.voiceActiveSectionListening = false;
			this.voiceText = undefined;

			if(annyang){
			annyang.abort();
			}
	}

	createGraph(filterData:any){
		this.isFiltered = true;
		let parentDiv = document.getElementById('parentDiv');
		let loaderDiv = document.getElementById('loaderDiv');
		document.getElementById('vizContainer')?.remove();
		let vizDiv = document.createElement('div');
		vizDiv.setAttribute("id", "vizContainer");
		parentDiv?.appendChild(vizDiv);
		let options = {
				hideTabs: true,
				width: "80%",
				height: "500px",
				onFirstInteractive: function() {
					console.log("viz has finished loading.");
				}
		};
		// Creating a viz object and embed it in the container div.
		this.viz = new tableau.Viz(vizDiv, filterData.url, options);  
		loaderDiv?.classList.add("showLoader");
		document.getElementById("vizContainer")?.classList.add("show");
		setTimeout(() => { 
			this.applyFilters(this.viz,filterData);
			loaderDiv?.classList.remove("showLoader");
			loaderDiv?.classList.add("hideLoader");
		}, 5000);
	}

	applyFilters (viz:any,filterData:any) {
		var mdyData = this.getLastNMonths(filterData.month);
		this.workbook = viz.getWorkbook();
		this.activeSheet = this.workbook.getActiveSheet();
		//var min= new Date(Date.UTC(mdyData.y1,mdyData.m1,mdyData.d1))
		//var max= new Date(Date.UTC(mdyData.y2,mdyData.m2,mdyData.d2))
		//console.log(min);
		console.log("filterssssss",filterData);


		let visitorName = filterData.visitor.toUpperCase();
		if(filterData.visitor.trim() != ""){
			this.workbook.getActiveSheet().applyFilterAsync( "Full Name",visitorName,tableau.FilterUpdateType.REPLACE);
			this.isFiltered = false;
		}
		if(filterData.tenant.trim() != ""){
			this.workbook.getActiveSheet().applyFilterAsync( "Company Name",filterData.tenant,tableau.FilterUpdateType.REPLACE);
			this.isFiltered = false;
		}
		if(filterData.building.trim() != ""){
			this.workbook.getActiveSheet().applyFilterAsync( "Building Name",filterData.building,tableau.FilterUpdateType.REPLACE);
			this.isFiltered = false;
		}
		if(mdyData.y1 != 0 && mdyData.y2 != 0){
			this.workbook.getActiveSheet().applyRangeFilterAsync("Weeks", {
				min: new Date(Date.UTC(mdyData.y1,mdyData.m1,mdyData.d1)),
				max: new Date(Date.UTC(mdyData.y2,mdyData.m2,mdyData.d2))
				});
		}
	}

	/**
	 * Show a notification
	 *
	 * @param {string} type    Notification type
	 * @param {string} message Notification message
	 */
	 public showNotification( type: string, message: string ): void {
		this.notifier.notify( type, message );
	}

}




