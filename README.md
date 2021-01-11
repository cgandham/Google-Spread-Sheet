
# JS SpreadSheet Application
A simple Spread Sheet application using JavaScript. 

# JS SpreadSheet Application Description
 * Add rows to the spreadsheet using a button.
 * Add columns to the spreadsheet using a button.
 * Delete rows or column using a button
 * Perform Formula Calculation on cells, Render it on change of values of the cells.

# Tools Used
Visual Studio Code

# Installations
 * Node.JS
 * ssas
 * RxJS
 
# Run Project Commands
 * npm init
 * npm install -g sass
 * To get all scss styles, alias command added to pkg.json --> npm run sass
 * Start page -> spreadSheet.html
 
# Code Walkthrough
* Dynamically added HTML table with default rows and columns.
* Listeners are created for adding and deleting a row or a column.
* Created a observable that listens on change of a event.
* Subjects which is also a Observable is created for formula calculations - BODMAS,SUM,DIFF,MUL,DIV. 
* On every formula cell, a class of formula is added and the subject is called for calculation.
* Subjects are called for every formula cell.
* On subscrbing the subjects the calculated formula result is updated in HTML table
* Download CSV - Looping to collect data in rows seperated by new line, within a row the column data is seperated by ','.Creating a Blob file of type -"text/csv". Calling msSaveBlob to download 
* Uploading CSV - using a file reader. Looping through table to fetch data.Forming the table and appending it.


    
     
