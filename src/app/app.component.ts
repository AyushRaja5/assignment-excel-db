import { Component } from '@angular/core';
import * as XLSX from 'xlsx';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontendapp';
  pageTitle = 'Save Excel data to Mongo Db in Batches';

  
selectedFile: File | null = null; // The selected Excel file for upload
headers: string[] = []; // The headers extracted from the Excel file
jsonDataObjects: any[] = []; // The JSON data objects extracted from the Excel file
uploadError: string | null = null; // Error message to display when there's an issue during file processing or data upload
uploadSuccess: string | null = null; // Success message to display when the data is successfully uploaded to the backend


  onFileSelected(event: any): void {
    const fileList: FileList = event.target.files || [];
    this.selectedFile = fileList.length > 0 ? fileList[0] : null;
    this.uploadSuccess = null;
  }
// Triggered when the user wants to Upload File
  uploadFile(): void {
    if (this.selectedFile) {
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        const data = e.target?.result;
        this.processExcelData(data);
      };
      fileReader.readAsBinaryString(this.selectedFile);
    } else {
      console.warn('No file selected.');
    }
  }

  // Processing excel file to fetch data from that file
  processExcelData(data: any): void {
    const workbook = XLSX.read(data, { type: 'binary' });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    try {
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Convert the worksheet data to JSON format with headers starting from the second row
      const [headers, ...rows] = jsonData as [string[], ...any[]];  // Extract headers and rows from the JSON data
      this.headers = headers;
      this.jsonDataObjects = rows.map((row: any[]) =>
        Object.fromEntries(headers.map((header, index) => [header, row[index]]))   // Map the rows to objects using the headers
      );

      console.log('Extracted Excel Data:', this.jsonDataObjects);
      this.uploadError = null; // Reset upload error if successful
    } catch (error) {
      console.error('Error processing Excel data:', error);
      this.uploadError = 'Error processing Excel data. Please check the file format.';  // Set an error message to be displayed to the user
    }
  }

  constructor(private http: HttpClient) { }
  ngOnInit(): void {
    this.connectBackend(); // Initiate a connection to the backend
  }
  connectBackend(): void {
    const backendEndpoint = 'http://localhost:3000/';
    
    // Make an HTTP GET request to the backend endpoint
    this.http.get(backendEndpoint, { responseType: 'text' })
      .subscribe(
        (response) => {
          console.log('Backend Connected :', response);
        },
        (error) => {
          console.error('Error fetching data from the backend:', error);
        }
      );
  }

  // Triggered when the user wants to push data to the backend
  pushData(): void {
    const backendEndpoint = 'http://localhost:3000/upload';

    this.http.post(backendEndpoint, { excelData: this.jsonDataObjects }, { observe: 'response' })
      .subscribe(
        (response) => {
          console.log('Response from the backend: Data saved in batches of 10', response.body);
          this.uploadSuccess = "Data saved to Mongo Db. Open Console to see batches"  // Showing Succcessfully inserted message to user
        },
        (error) => {
          console.error('Error pushing data to the backend:', error);
          this.uploadError = 'Error pushing data to the backend. Please try again.';  // Showing error message to user
        }
      );
  }

}
