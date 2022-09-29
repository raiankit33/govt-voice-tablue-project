import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpClientModule } from "@angular/common/http";
import { catchError, map } from "rxjs/operators";
import { Observable, Subject, throwError } from 'rxjs';
declare var webkitSpeechRecognition: any;
@Injectable({
  providedIn: 'root'
})
export class VoiceRecognitionService {
  recognition: any;
  isStoppedSpeechRecog = false;
  public text = '';
  private voiceToTextSubject: Subject<string> = new Subject();
  private speakingPaused: Subject<any> = new Subject();
  private tempWords: string = '';
  constructor(private http: HttpClient) { }

  /**
   * @description Function to return observable so voice sample text can be send to input.
   */
  speechInput() {
    return this.voiceToTextSubject.asObservable();
  }

  /**
   * @description Function to initialize voice recognition.
   */
  init() {
    this.recognition = new webkitSpeechRecognition();
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.addEventListener('result', (e: any) => {
      const transcript = Array.from(e.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join('');
      this.tempWords = transcript;
      this.voiceToTextSubject.next(this.text || transcript);
    });
    return this.initListeners();
  }

  /**
   * @description Add event listeners to get the updated input and when stoped
   */
  initListeners() {
    this.recognition.addEventListener('end', (condition: any) => {
      this.recognition.stop();
    });
    return this.speakingPaused.asObservable();
  }

  /**
   * @description Function to mic on to listen.
   */
  start() {
    this.text = '';
    this.isStoppedSpeechRecog = false;
    this.recognition.start();
    this.recognition.addEventListener('end', (condition: any) => {
      if (this.isStoppedSpeechRecog) {
        this.recognition.isActive = true;
        this.recognition.stop();
      } else {
        this.isStoppedSpeechRecog = false;
        this.wordConcat();
        // Checked time with last api call made time so we can't have multiple start action within 200ms for countinious listening
        // Fixed : ERROR DOMException: Failed to execute 'start' on 'SpeechRecognition': recognition has already started.
        if (!this.recognition.lastActiveTime || (Date.now() - this.recognition.lastActive) > 200) {
          this.recognition.start();
          this.recognition.lastActive = Date.now();
        }
      }
      this.voiceToTextSubject.next(this.text);
    });
  }

  /**
   * @description Function to stop recognition.
   */
  stop() {
    this.text = '';
    this.isStoppedSpeechRecog = true;
    this.wordConcat()
    this.recognition.stop();
    this.recognition.isActive = false;
    this.speakingPaused.next('Stopped speaking');
  }

  /**
   * @description Merge previous input with latest input.
   */
  wordConcat() {
    this.text = this.text.trim() + ' ' + this.tempWords;
    this.text = this.text.trim();
    this.tempWords = '';
  }

  speechToText(data:any){

    return this.http.post("","")
    .pipe(catchError(this.handleError));
  }

  uploadFileOnserver(blob:any):Observable<any>{
    let fd = new FormData();
    fd.append("file",blob, "file.wav");
    return this.http.post("https://ezeelink.stagingapps.xyz/api/fileUpload-VAMS",fd)
    .pipe(catchError(this.handleError));
  }

  getText(id:any):Observable<any>{
    let payload = {"id": id};
    return this.http.post("https://8wf4bmsax8.execute-api.ap-south-1.amazonaws.com/VAMS/",payload)
    .pipe(catchError(this.handleError));
  }

  getAssembyAIAuthToken():Observable<any>{
    return this.http.get('https://ezeelink.stagingapps.xyz/api/getAssemblyRealTimeToken')
    .pipe(catchError(this.handleError));
  }

  handleError(error:any) {
    return throwError(error.message || "server Error...........!")
  }
}