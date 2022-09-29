import { Component, NgZone, OnInit , ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import { NotifierService } from 'angular-notifier';
import {VoiceRecognitionService} from '../services/VoiceRecognition.service';
import * as RecordRTC from 'recordrtc';
import { DomSanitizer } from '@angular/platform-browser';
import { ResultReason } from 'microsoft-cognitiveservices-speech-sdk'; 	
import * as SpeechSDK from 'microsoft-speech-browser-sdk';
//const speechsdk = require('microsoft-cognitiveservices-speech-sdk')

declare const annyang: any;
//declare const responsiveVoice: any;
declare var tableau: any;
declare let $: any
declare var MediaRecorder: any;

@Component({
	selector: 'voice-comp',
	templateUrl: './voice.component.html',
	styleUrls: ['./voice.component.css'],
	encapsulation: ViewEncapsulation.None
})
export class VoiceComponent implements OnInit {
	title = 'micRecorder';
	//Lets declare Record OBJ
	record:any;
	//Will use this flag for toggeling recording
	recording = false;
	//URL of Blob
	url:any;
	error:any;
	graphHeaderText = "";
	readonly monthList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	viz: any;
	workbook: any;
	activeSheet: any
	voiceText: any = "Say something!";
	msg = ''
	showGraph = true;
	socket:any;
	token:any;

	speechAuthToken: any;
  	recognizer: any;


	constructor(private ngZone: NgZone, public notifier: NotifierService,private domSanitizer: DomSanitizer,private voiceService:VoiceRecognitionService,private cd: ChangeDetectorRef) {
	 }

	ngOnInit(): void {
		// let loaderDiv = document.getElementById('loaderDiv');
		// loaderDiv?.classList.add("hideLoader");
		$('#addloader').addClass('hide');
		$('#addloaderbkgrnd').addClass('hide');
		this.recognizer = this.recognizerSetup(SpeechSDK, SpeechSDK.RecognitionMode.Conversation, 'en-US',
		SpeechSDK.SpeechResultFormat.Simple, "5a122119d36b404aba6b13e6bc4edf61");
		const str = "stolen goods count in jammu and kashmir";
		const slug = str.split('in').pop();
		console.log(slug)
	
	}

	recognizerSetup(SDK:any, recognitionMode:any, language:any, format:any, subscriptionKey:any) {
		const recognizerConfig = new SDK.RecognizerConfig(
			new SDK.SpeechConfig(
				new SDK.Context(
					new SDK.OS(navigator.userAgent, 'Browser', null),
					new SDK.Device('SpeechSample', 'SpeechSample', '1.0.00000'))),
			recognitionMode, // SDK.RecognitionMode.Interactive  (Options - Interactive/Conversation/Dictation)
			language, // Supported languages are specific to each recognition mode Refer to docs.
			format); // SDK.SpeechResultFormat.Simple (Options - Simple/Detailed)
	
		// Alternatively use SDK.CognitiveTokenAuthentication(fetchCallback, fetchOnExpiryCallback) for token auth
		const authentication = new SDK.CognitiveSubscriptionKeyAuthentication(subscriptionKey);
	
		return SpeechSDK.CreateRecognizer(recognizerConfig, authentication);
	  }
	
	  RecognizerStart() {
		this.recording = true;
		this.recognizer.Recognize((event:any) => {
			/*
				Alternative syntax for typescript devs.
				if (event instanceof SDK.RecognitionTriggeredEvent)
			*/
			switch (event.Name) {
				case 'RecognitionTriggeredEvent' :
					console.log('Initializing');
					break;
				case 'ListeningStartedEvent' :
					console.log('Listening');
					break;
				case 'RecognitionStartedEvent' :
					console.log('Listening_Recognizing');
					break;
				case 'SpeechStartDetectedEvent' :
					console.log('Listening_DetectedSpeech_Recognizing');
					console.log(JSON.stringify(event.Result)); // check console for other information in result
					break;
				case 'SpeechHypothesisEvent' :
					// UpdateRecognizedHypothesis(event.Result.Text);
					//console.log(JSON.stringify(event.Result)); // check console for other information in result
					break;
				case 'SpeechFragmentEvent' :
					// UpdateRecognizedHypothesis(event.Result.Text);
					this.voiceText = event.Result.Text;
					console.log(JSON.stringify(event.Result.Text)); // check console for other information in result
					break;
				case 'SpeechEndDetectedEvent' :
					// OnSpeechEndDetected();
					console.log('Processing_Adding_Final_Touches');
					console.log(JSON.stringify(event.Result)); // check console for other information in result
					break;
				case 'SpeechSimplePhraseEvent' :
					// UpdateRecognizedPhrase(JSON.stringify(event.Result, null, 3));
					break;
				case 'SpeechDetailedPhraseEvent' :
					// UpdateRecognizedPhrase(JSON.stringify(event.Result, null, 3));
					break;
				case 'RecognitionEndedEvent' :
					// OnComplete();
					console.log('Idle');
					console.log(JSON.stringify(event)); // Debug information
					break;
			}
		})
		.On(() => {
			// The request succeeded. Nothing to do here.
		},
		(error:any) => {
			console.error(error);
		});
	  }
	
	  recognizerStop() {
		// recognizer.AudioSource.Detach(audioNodeId) can be also used here. (audioNodeId is part of ListeningStartedEvent)
		$('#addloader').removeClass('hide');
		$('#addloader').addClass('show');
		$('#addloaderbkgrnd').removeClass('hide');
		$('#addloaderbkgrnd').addClass('show');
		$('#addloading').addClass('spinner-border');
		this.recording = false;
		this.recognizer.AudioSource.TurnOff();
		this.createCommands(this.voiceText);
	  }

	getToken(){
		this.voiceService.getAssembyAIAuthToken().subscribe(res => {
		  console.log("getToken",res);
		  if(res.token){
			  this.token = res.token;
			  this.initiateRecording();
		  }
		  else{
			  this.token = '';
		  }
		});
	}

	getLastNMonths(numberOfLastMonths: any) {
		if(isNaN(numberOfLastMonths)){
			return { m1: 0, m2: 0, d1: 0, d2: 0, y1: 0, y2: 0 };
		}
		var today = new Date();
		var d;
		var prevMonth;
		var month;
		var mdyObj = { m1: 0, m2: 0, d1: 0, d2: 0, y1: 0, y2: 0 };

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


// vacinnation case in India 
	getFiltersForVaccinationCount(instruction: string) {
		let commandArray = instruction.split(" ");
	
		let monthCount = 0;
		let url = "https://public.tableau.com/views/Vaccine_16566629325400/Sheet1?:language=en-GB&publish=yes&:display_count=n&:origin=viz_share_link";
		let monthIndex = commandArray.indexOf("months") - 1;

		if (monthIndex < 0) {
			monthIndex = commandArray.indexOf("month") - 1;
		}
		if (monthIndex > 0) {
			if (commandArray[monthIndex] == "last") {
				monthCount = 1;
			}
			else {
				let monthString = commandArray[monthIndex];
				monthCount = Number(this.getMonthNumber(monthString));
			}
		}


		return {  url: url  };

	} 

	// confirmed case in India 
	getFiltersForConfirmedCase(instruction: string) {
		let commandArray = instruction.split(" ");
	
		let monthCount = 0;
		let url = "https://public.tableau.com/views/Confirmed_16569280439930/confirmedmap?:language=en-GB&publish=yes&:display_count=n&:origin=viz_share_link";
		//let monthIndex = commandArray.indexOf("months") - 1;

		return {  url: url  };

	} 

		//  recovered covid case in India 
		getFiltersForRecovered(instruction: string) {
			let commandArray = instruction.split(" ");
			let url = "https://public.tableau.com/views/Recovered_16569281164730/Recoveredmap?:language=en-GB&publish=yes&:display_count=n&:origin=viz_share_link";
		//	let monthIndex = commandArray.indexOf("months") - 1;

			return {  url: url  };
	
		}
	
	//  death covid case in India 
	getFiltersForDeathCase(instruction: string) {
		let commandArray = instruction.split(" ");
		let url = "https://public.tableau.com/views/Death_16569282598720/DeathMap?:language=en-GB&publish=yes&:display_count=n&:origin=viz_share_link";
	//	let monthIndex = commandArray.indexOf("months") - 1;

		return {  url: url  };

	}
	// -------------------------------------------//

	

	getFiltersForParticularVisitorCase(instruction: string) {
		let commandArray = instruction.split(" ");
		let monthCount = 0;
		let visitorName:any = "";
		let tenantName:any = "";
		if (instruction.includes("often") || instruction.includes("visited")) {
			this.graphHeaderText = "Visitor count of visiting a Company";
			let monthIndex = commandArray.indexOf("months") - 1;
			if (monthIndex < 0) {
				monthIndex = commandArray.indexOf("month") - 1;
			}
			let url = "https://public.tableau.com/views/Q1a_16476992902710/Sheet1?:language=en-GB&:display_count=n&:origin=viz_share_link";
			if (monthIndex > 0) {
				if (commandArray[monthIndex] == "last") {
					monthCount = 1;
				}
				else {
					let monthString = commandArray[monthIndex];
					monthCount = Number(this.getMonthNumber(monthString));
				}
			}
			let indexOfOften = commandArray.indexOf("often");
			let indexOfVisited = commandArray.indexOf("visited");
			let indexOfIn = commandArray.indexOf("in");
			visitorName = this.retrieveName(indexOfOften, indexOfVisited, commandArray)?.toUpperCase();
			tenantName = this.retrieveName(indexOfVisited, indexOfIn, commandArray);

			return { month: monthCount, visitor: visitorName, tenant: tenantName, url: url, building: "" };
		}
		else if (instruction.includes("meet") || instruction.includes("whom")) {
			this.graphHeaderText = "Host wise visitor count";
			let monthIndex = commandArray.indexOf("months") - 1;
			if (monthIndex < 0) {
				monthIndex = commandArray.indexOf("month") - 1;
			}
			let url = "https://public.tableau.com/views/Q1_B_NEW/Sheet1?:language=en-GB&:display_count=n&:origin=viz_share_link";
			if (monthIndex > 0) {
				if (commandArray[monthIndex] == "last") {
					monthCount = 1;
				}
				else {
					let monthString = commandArray[monthIndex];
					monthCount = Number(this.getMonthNumber(monthString));
				}
			}
			let indexOfDid = commandArray.indexOf("did");
			let indexOfCome = commandArray.indexOf("come");
			let firstIndexOfIn = commandArray.indexOf("in");
			let lastIndexOfIn = commandArray.lastIndexOf("in");
			visitorName = this.retrieveName(indexOfDid, indexOfCome, commandArray)?.toUpperCase();
			tenantName = this.retrieveName(firstIndexOfIn, lastIndexOfIn, commandArray);
			return { month: monthCount, visitor: visitorName, url: url, tenant: tenantName, building: "" };
		}
		else {
			this.graphHeaderText = "";
			return {month: 0, visitor: "", url: "", tenant: "", building: ""};
		}
	} 
 
	// stolen good count collection
	getFiltersForStolenGood(instruction: string) {
		let commandArray = instruction.split(" ");
		//console.log(commandArray)
		let monthCount = 0;
		let date: any = "";
		let year: any ;
		if (instruction.includes("state wise") || instruction.includes("statewise") ) {
			this.graphHeaderText = "State wise stolen goods count ";
		
			let url = "https://public.tableau.com/views/Crime1_16559902662320/Sheet22?:language=en-GB&publish=yes&:display_count=n&:origin=viz_share_link";
		

			const last =commandArray.length - 1; 
			let years = commandArray[last];
			
			return {  year :years, url: url };
		}
		else if (instruction.includes("count") ) {

			this.graphHeaderText = "Stolen goods count of a State";
		
			let url ="https://public.tableau.com/views/Crime2_16560549462120/Sheet3?:language=en-GB&:display_count=n&:origin=viz_share_link"
	
		const name = this.voiceText.split('in ').pop();
		

			   
			// var name
			// if( commandArray.length  == 6){
			// 	let string = commandArray.indexOf("in") + 1; 
			// 	let lastString = commandArray.indexOf("in") + 2;  

			// 	let fname = commandArray[string];
			// 	let lastvalue = commandArray[lastString];

			// 	name  = fname + " " + lastvalue 
			
			// }else{
			// 	let visitorName = commandArray.indexOf("in") + 1; 
			// 	 name = commandArray[visitorName]; 
				
			// }
			// let name = commandArray[visitorName];

		// 	let indexOfFor = commandArray.indexOf("in");
		// 	let indexOfIn = '5';
		// let name = this.retrieveName(indexOfFor, indexOfIn, commandArray);

			return {  StolenState: name, url: url};
		}
		else {
			this.graphHeaderText = "";
			return {  state: "", url: "" };
		}
	}

  //  carrot wise data collection 
	getFilters(instruction: string) {
		let commandArray = instruction.split(" ");
		
		let monthCount = 0;
	
		if (instruction.includes("carrot average") ) {
			this.graphHeaderText = "Average price by state";
			let monthIndex = commandArray.indexOf("months") - 1;
			if (monthIndex < 0) {
				monthIndex = commandArray.indexOf("month") - 1;
			}

			// with extract refresh URL 
			//let url = "https://public.tableau.com/app/profile/vaibhav.agarwal7916/viz/Demo1_16558765326700/Sheet1?:language=en-GB&:display_count=n&:origin=viz_share_link";
		   let url = "https://public.tableau.com/views/Demo1_16558765326700/Sheet1?:language=en-GB&:display_count=n&:origin=viz_share_link"
		

			if (monthIndex > 0) {
				if (commandArray[monthIndex] == "last") {
					monthCount = 1;
				}
				else {
					let monthString = commandArray[monthIndex];
					monthCount = Number(this.getMonthNumber(monthString));
				}
			}
		

			return { month: monthCount,  url: url };
		}
		else if (instruction.includes("carrot price") ) {
			this.graphHeaderText = "State wise carrot price";
			let monthIndex = commandArray.indexOf("months") - 1;
			if (monthIndex < 0) {
				monthIndex = commandArray.indexOf("month") - 1;
			}
			// with extract refresh URL 
			let url = "https://public.tableau.com/views/Demo_16557284576120/Sheet2?:language=en-GB&:display_count=n&:origin=viz_share_link";
		
			if (monthIndex > 0) {
				if (commandArray[monthIndex] == "last") {
					monthCount = 1;
				}
				else {
					let monthString = commandArray[monthIndex];
					monthCount = Number(this.getMonthNumber(monthString));
				}
			}

	
			const name = this.voiceText.split('in ').pop();

			return { month: monthCount, State: name, url: url};
		}
		else {
			this.graphHeaderText = "";
			return { month: 0, state: "", url: "" };
		}
	}

	retrieveName(startingIndex: any, endingIndex: any, commandArray: any) {
		if(startingIndex < 0 || endingIndex < 0 || commandArray.length == 0){
			return "";
		}
		let name = "";
		for (let i = startingIndex + 1; i < endingIndex; i++) {
			name = name + commandArray[i] + " ";
		}
		return name.trim().toLowerCase();
	}

	createCommands(instruction: any) {
	
		let commandInLowerCase = instruction.toLowerCase();
		if (commandInLowerCase.includes("carrot") ) {
			let filterParams = this.getFilters(commandInLowerCase);
			this.createGraph(filterParams);
		}
		else if(instruction.includes("often") || instruction.includes("meet")){
			let filterParams = this.getFiltersForParticularVisitorCase(instruction);
			this.createGraph(filterParams);
		}
		else if (commandInLowerCase.includes("stolen") ) {
			let filterParams = this.getFiltersForStolenGood(commandInLowerCase);
			this.createGraph(filterParams);
		
		}

		else if (commandInLowerCase.includes("vaccination") ) {
			let filterParams = this.getFiltersForVaccinationCount(commandInLowerCase);
			this.createGraph(filterParams);
			this.graphHeaderText = "Total vaccination count in India";
		}
		else if (commandInLowerCase.includes("confirmed") ) {
			let filterParams = this.getFiltersForConfirmedCase(commandInLowerCase);
			this.createGraph(filterParams);
			this.graphHeaderText = "Total confirmed cases in India";
		} 
		else if (commandInLowerCase.includes("recovered") ) {
			let filterParams = this.getFiltersForRecovered(commandInLowerCase);
			this.createGraph(filterParams);
			this.graphHeaderText = "Total recovered cases in India";
		} 
		else if (commandInLowerCase.includes("death") ) {
			let filterParams = this.getFiltersForDeathCase(commandInLowerCase);
			this.createGraph(filterParams);
			this.graphHeaderText = "Total death cases in India";
		}
		else {
			this.showNotification("info", "Incorrect voice command!");
			$('#addloader').removeClass('show');
			$('#addloading').removeClass('spinner-border text-danger');
			$('#addloader').addClass('hide');
			$('#addloaderbkgrnd').removeClass('show');
			$('#addloaderbkgrnd').addClass('hide');
		}
	}

	createGraph(filterData: any) {
		let parentDiv = document.getElementById('parentDiv');
		//let loaderDiv = document.getElementById('loaderDiv');
		document.getElementById('vizContainer')?.remove();
		let vizDiv = document.createElement('div');
		vizDiv.setAttribute("id", "vizContainer");
console.log(filterData)
		parentDiv?.appendChild(vizDiv);
		let options = {
			hideTabs: true,
			width: "80%",
			height: "500px",
			onFirstInteractive: function () {
				console.log("viz has finished loading.");
			}
		};
		// Creating a viz object and embed it in the container div.
		this.viz = new tableau.Viz(vizDiv, filterData.url, options);
		document.getElementById("vizContainer")?.classList.add("show");
		setTimeout(() => {
			 this.applyFilters(this.viz, filterData);

			$('#addloader').removeClass('show');
			$('#addloading').removeClass('spinner-border text-danger');
			$('#addloader').addClass('hide');
			$('#addloaderbkgrnd').removeClass('show');
			$('#addloaderbkgrnd').addClass('hide');
		},6000);
	}

	 titleCase(string:any) {
		var sentence = string.toLowerCase().split(" ");
		for(var i = 0; i< sentence.length; i++){
		   sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
		}
return sentence.join(" ")
	}


	applyFilters(viz: any, filterData: any) {
		var mdyData = this.getLastNMonths(filterData.month);
		this.workbook = viz.getWorkbook();
		this.activeSheet = this.workbook.getActiveSheet();
		// console.log("filterssssss", filterData);

	
		// if (filterData.visitor.trim() != "" && filterData.visitor != null) {
		// 	let data = this.workbook.getActiveSheet().applyFilterAsync("Full Name", filterData.visitor, tableau.FilterUpdateType.REPLACE);
		// }
		if (filterData.State != "" && filterData.State != null) {
		//	let State = filterData.State.charAt(0).toUpperCase() + filterData.State.slice(1);
		let State = this.titleCase(filterData.State)
		console.log(State)
			this.workbook.getActiveSheet().applyFilterAsync("State", State, tableau.FilterUpdateType.REPLACE);
		}
		if (filterData.year != "" && filterData.year != null) {
		
			this.workbook.getActiveSheet().applyRangeFilterAsync("Dates",  {
				// min: new Date(filterData.date.min),
				// max: new Date(filterData.date.max)
				min: new Date(Date.UTC(filterData.year, 0, 1)),
				max: new Date(Date.UTC(filterData.year, 11, 31))
			});
		
		}
		// if (filterData.tenant.trim() != "" && filterData.tenant != null) {
		// 	this.workbook.getActiveSheet().applyFilterAsync("Company Name", filterData.tenant, tableau.FilterUpdateType.REPLACE);
		// }
		if (filterData.StolenState != "" && filterData.StolenState != null) {
			 let Stolen = this.titleCase(filterData.StolenState)
			 console.log(Stolen)
			
			
			this.workbook.getActiveSheet().applyFilterAsync("Area Name", Stolen, tableau.FilterUpdateType.REPLACE);
		}
		if (mdyData.y1 != 0 && mdyData.y2 != 0) {
			console.log(mdyData.y1, mdyData.m1, mdyData.d1)
			this.workbook.getActiveSheet().applyRangeFilterAsync("Date", {
				min: new Date(Date.UTC(mdyData.y1, mdyData.m1, mdyData.d1)),
				max: new Date(Date.UTC(mdyData.y2, mdyData.m2, mdyData.d2))
			});
		}
		if(mdyData.y1 == 0 && mdyData.y2 == 0 && (filterData.tenant == null || filterData.tenant.trim() == "") 
		&& (filterData.visitor == null || filterData.visitor.trim() == "" ) && (filterData.building == null || filterData.building.trim() == "" )){
			$('#addloader').removeClass('show');
			$('#addloading').removeClass('spinner-border text-danger');
			$('#addloader').addClass('hide');
			$('#addloaderbkgrnd').removeClass('show');
			$('#addloaderbkgrnd').addClass('hide');
		}
	}

	getMonthNumber(month:any){
		if(month.toUpperCase() =="ONE"){
			return 1;
		}
		else if(month.toUpperCase() =="TWO"){
			return 2;
		}
		else if(month.toUpperCase() =="THREE"){
			return 3;
		}
		else if(month.toUpperCase() =="FOUR"){
			return 4;
		}
		else if(month.toUpperCase() =="FIVE"){
			return 5;
		}
		else if(month.toUpperCase() =="SIX"){
			return 6;
		}
		else{
			return month;
		}
	}

	sanitize(url: string) {
		return this.domSanitizer.bypassSecurityTrustUrl(url);
	}

	initiateRecording(){
		this.voiceText = "Say something!";
		this.recording = true;
		window.navigator.mediaDevices.getUserMedia({
			video: false,
			audio: true
		})
		.then(this.streamAudioToWebSocket) 
		.catch(function (error) {
			console.log('There was an error streaming your audio to Assembly AI. Please try again.', error);
		});
	}

	waitForOpenConnection = (socket:any) => {
		if(socket.readyState === socket.OPEN){
			return true;
		}
		else{
			this.socket = new WebSocket(`wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${this.token}`);
			this.waitForOpenConnection(socket);
		}
		return false;
	}

	streamAudioToWebSocket = async (userMediaStream:any) => {
		var StereoAudioRecorder = RecordRTC.StereoAudioRecorder;

		console.log('start streamAudioToWebSocket22222');
		//open up our WebSocket connection
		this.socket =  await new WebSocket(`wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${this.token}`);
		//this.waitForOpenConnection(this.socket);
		console.log('start streamAudioToWebSocket44444',this.socket);

		// handle incoming messages to display transcription to the DOM
		let texts:any = {};
		this.socket.onmessage = (message:any) => {
			this.voiceText = "";
		  //let msg = '';
		  let res = JSON.parse(message.data);
		  texts[res.audio_start] = res.text;
		  //console.log("socket response",res.text);
		  const keys = Object.keys(texts);
		  keys.sort((a:any, b:any) => a - b);
		  for (const key of keys) {
			if (texts[key]) {
			  this.voiceText += ` ${texts[key]}`;
			}
		  }
		  //console.log("audiotext",this.msg);
		};
	
		// this.socket.onerror = (event:any) => {
		//   console.error(event);
		//   this.socket.close();
		// }
	

		this.socket.onopen = () => {
			console.log("in open state");
			this.record = new StereoAudioRecorder(userMediaStream, {
				type: 'audio',
				mimeType: 'audio/webm;codecs=pcm', // endpoint requires 16bit PCM audio
				recorderType: StereoAudioRecorder,
				timeSlice: 250, // set 250 ms intervals of data that sends to AAI
				desiredSampRate: 16000,
				numberOfAudioChannels: 1, // real-time requires only one channel
				bufferSize: 4096,
				audioBitsPerSecond: 128000,
				ondataavailable: (blob:any) => {
				  const reader = new FileReader();
				  reader.onload = () => {
					const base64data = (<string>reader.result);
					//console.log("base64data",JSON.stringify({ audio_data: base64data.split('base64,')[1] }));
					// audio data must be sent as a base64 encoded string
					if (this.socket && this.socket.readyState === this.socket.OPEN) {
					  this.socket.send(JSON.stringify({ audio_data: base64data.split('base64,')[1] }));
					}
				  };
				  reader.readAsDataURL(blob);
				},
			  });
	
			  this.record.record();
		};
	  }

	// initiateRecording() {
	// 	this.voiceText = "Say something!";
	// 	this.recording = true;
	// 	let mediaConstraints = {
	// 	video: false,
	// 	audio: true,
	// 	echoCancellation:true
	// 	};
	// 	navigator.mediaDevices.getUserMedia(mediaConstraints).then(this.successCallback.bind(this), this.errorCallback.bind(this));
	// }

	successCallback(stream:any) {
		var options = {
		mimeType: "audio/wav",
		numberOfAudioChannels: 1,
		sampleRate: 48000,
		};
		//Start Actuall Recording
		var StereoAudioRecorder = RecordRTC.StereoAudioRecorder;
		this.record = new StereoAudioRecorder(stream, options);
		this.record.record();
	}

	stopRecording() {
		$('#addloader').removeClass('hide');
		$('#addloader').addClass('show');
		$('#addloaderbkgrnd').removeClass('hide');
		$('#addloaderbkgrnd').addClass('show');
		$('#addloading').addClass('spinner-border');
		if(this.socket && this.socket.readyState === this.socket.OPEN){
			this.socket.send(JSON.stringify({terminate_session: true}));
			this.socket.close();
			this.socket = null;
		}
		this.recording = false;
		this.record.stop(this.processRecording.bind(this));
	}

	processRecording(blob:any) {
		this.voiceText = this.removePunctuation(this.voiceText);
		console.log("Final audioText",this.voiceText);
		this.createCommands(this.voiceText);

		// this.url = URL.createObjectURL(blob);
		// this.voiceService.uploadFileOnserver(blob).subscribe(res => {
		// 	// console.log("voice Response",res);
		// 	// console.log("blob", blob);
		// 	// console.log("url", this.url);
		// 	setTimeout(() => {
		// 		this.getTextFromSpeech(res);
		// 	},6000);
		// });
	
	}

	removePunctuation(text:string){
		let regex = /[.,]/g;
		let result = text.replace(regex, '');
		return result;
	}

	getTextFromSpeech(res:any){
		this.voiceService.getText(res.data).subscribe(result => {
			if(result.statusCode == 200 && result.data.status == "completed"){
				console.log("text data",result);
				this.voiceText = result.data.text;
				this.createCommands(result.data.text);
			}
			else{
				setTimeout(() => {
					this.getTextFromSpeech(res);
				},3000);
			}
		});
	}

	errorCallback(error:any) {
		this.error = 'Can not play audio in your browser';
	}

		/**
	 * Show a notification
	 *
	 * @param {string} type    Notification type
	 * @param {string} message Notification message
	 */
		 public showNotification(type: string, message: string): void {
			this.notifier.notify(type, message);
		}

}




