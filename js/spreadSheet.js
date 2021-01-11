//const Rx = require('rxjs');
let defaultRowCount = 6; // No of rows
let defaultColCount = 6; // No of cols
var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

var cellEventHandlers = (td) => {
    //on change event
    Rx.Observable.fromEvent(td, 'change').subscribe(function (event){
        if (event.isTrusted) {
           if (isValidFormula(td)){
            td.dataset.formula = td.querySelector('input').value;
            td.classList.add("formula");
          }
          else{
            if(td.querySelector('input').value ==""){
              td.classList.remove("formula");

            }

          }
          let formulacells = Array.from(document.getElementsByClassName("formula"));
          formulacells.forEach(formula => {
            calculateFormula(formula);

          })
            
        }

    })

    //Double Click to show formula
    td.addEventListener('dblclick', function (event) {
      if (event.isTrusted) {
          var formula = td.getAttribute("data-formula");
          if(formula != null && td.classList.contains("formula"))
          document.getElementById(td.id).querySelector('input').value  = formula;
      }
  });

}
//check if formula is valid
isValidFormula = (td) => {
  let isValid = td.querySelector('input').value.toLowerCase().indexOf("=sum")==0
				|| td.querySelector('input').value.toLowerCase().indexOf("=diff")==0
				|| td.querySelector('input').value.toLowerCase().indexOf("=mul")==0
                || td.querySelector('input').value.toLowerCase().indexOf("=div")==0
                ||td.querySelector('input').value.toLowerCase().indexOf("=")==0;
  return isValid;
}

calculateFormula = (formula) => {
        let dataId = formula.id;

				// Gets the data attribute
        let dataFormula = formula.dataset.formula;
        if(!dataFormula.includes(':')){
          bodmas.next({id:dataId,formula: dataFormula});
        }

				let regExp = /\(([^)]+)\)/;
				let matches = regExp.exec(dataFormula);
				if (matches || ( dataFormula.startsWith('=') &&!dataFormula.includes(':') )) {
						// Adds range in the array
              let array = matches!=null? matches[1].toUpperCase().split(':'):[];
			if (array.length == 2 || ( dataFormula.startsWith('=') &&!dataFormula.includes(':'))) { 
						// publish data to subscriber
						let f = dataFormula.toLowerCase();
			if (f.indexOf("=sum") == 0) {
              calculateSum.next({id: dataId, x: array[0], y: array[1]});
            }
						else if(f.indexOf("=diff") == 0) {
							calculateDiff.next({id: dataId, x: array[0], y: array[1]});
            }
            else if(f.indexOf("=mul") == 0) {
							calculateMul.next({id: dataId, x: array[0], y: array[1]});
            } 
            else if(f.indexOf("=div") == 0) {
							calculateDiv.next({id: dataId, x: array[0], y: array[1]});
            } 
            else{
                bodmas.next({id:dataId,formula: dataFormula});

            }
                        
						
					}
				}

}
 // Subjects for Calculations
var calculateSum = new Rx.Subject();
var calculateDiff = new Rx.Subject();
var calculateMul = new Rx.Subject();
var calculateDiv = new Rx.Subject();
var bodmas = new Rx.Subject();


// Sum Calculation Subscription
calculateSum.map(d => {
	let {id, x, y} = d;
	let sum = 0;
	if (x && y) {
        let str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let firstNumber;
        let lastNumber;
        // Row id of first parameter in the range
        let fnumber = document.getElementById(x).parentNode.id.split("_");
        // Row id of second parameter in the range
        let lnumber = document.getElementById(y).parentNode.id.split("_");
        // First letter of the first parameter of the range
        let firstLetter = document.getElementById(x).id;
        // First letter of the second parameter of the range
        let lastLetter = document.getElementById(y).id;
        let tablearea = document.getElementById('table-main');
        let rowNumber1, rowNumber2;
        let regex = /[+-]?\d+(?:\.\d+)?/g;
        let match1 = regex.exec(firstLetter);
        // Starting range while calculating for columns
        rowNumber1 = match1[0];
        regex.lastIndex = 0;
        let match2 = regex.exec(lastLetter);
        // Ending range while calculating for columns
        rowNumber2 = match2[0];
        // Check when the operation is for rows
        if (fnumber[1] == lnumber[1]) {
            let cellsarea = tablearea.rows[fnumber[1]].cells;
            for (let i = 0; i < str.length; i++) {
                // Get number equivalent of the letter which is the name of the column
                if (str[i] == firstLetter[0]) {
                    firstNumber = i + 1;
                }
                if (str[i] == lastLetter[0]) {
                    lastNumber = i + 1;
                }
            }
            //  To calculate sum
            sum = 0;
            for (let i = firstNumber; i <= lastNumber; i++) {
                let val1 = cellsarea[i].querySelector('input').value;
                // Only accept positive, negative and float numbers, else the value will be made 0
                if (val1 == "" || !val1.match(/^[-+]?[0-9]*\.?[0-9]+$/)) {
                    //val1 = 0;
                    sum = "!ERR";
                       break;
                }
                sum += parseFloat(val1);
            }       
        } 
        // Check when the operation is for columns
        else if (firstLetter[0] == lastLetter[0]) {
            let colNumber;
            for (let i = 0; i < str.length; i++) {
                // Get number value as the position of the letter in the column
                if (str[i] == firstLetter[0]) {
                    colNumber = i ;
                }
            }
            // To calculate sum
            sum = 0;
            for (let j = parseInt(rowNumber1); j <= parseInt(rowNumber2); j++) {
                if (colNumber >= 0) {
                    let val2 = tablearea.rows[j].querySelectorAll('td')[colNumber].querySelector('input').value;
                    // Only accept positive, negative and float numbers, else the value will be made 0
                    if (val2 == "" || !val2.match(/^[-+]?[0-9]*\.?[0-9]+$/)) {
                       // val2 = 0;
                       sum = "!ERR";
                       break;
                    }
                    sum += parseFloat(val2);
                }
            }
            
            
        }
       
		return {id: id, sum: sum};
    }
	
})
.subscribe(data => {
	document.getElementById(data.id).querySelector('input').value = data.sum;
});

//BODMAS
bodmas.map(d => {
  let {id, formula} = d;
  let table = document.getElementById('table-main');
  formula = formula.substring(1);
  let fc = formula;
  let cells = fc.replace(/[*/+-]+/g, "#").replace(/[\(|\|\.)]/g, "").split('#')
  for(let i=0;i<cells.length;i++){
      let colNumber = getNoEqualToLetter(cells[i][0]);
      let rowNumber = cells[i].substring(1);
      let value = table.rows[rowNumber].querySelectorAll('td')[colNumber].querySelector('input').value;
      if(value == "" || !value.match(/^[-+]?[0-9]*\.?[0-9]+$/)){
          formula="!ERR";
          break;
      }
      formula =  formula.replace(cells[i],value);
  }
  let res = formula!="!ERR" ? eval(formula): formula;
  return {id: id, res: res};

})
.subscribe(data => {
	document.getElementById(data.id).querySelector('input').value = data.res;
});

function getNoEqualToLetter(alpha){

  for (let i = 0; i < letters.length; i++) {
    // Get number equivalent of the letter which is the name of the column
    if (letters[i] == alpha) 
      return i;
  }
  return;
}




// Difference Calculation Subscription
calculateDiff.map(d => {
	let {id, x, y} = d;
	let diff = 0;
	if (x && y) {
        let str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let firstNumber;
        let lastNumber;
        // Row id of first parameter in the range
        let fnumber = document.getElementById(x).parentNode.id.split("_");
        // Row id of second parameter in the range
        let lnumber = document.getElementById(y).parentNode.id.split("_");
        // First letter of the first parameter of the range
        let firstLetter = document.getElementById(x).id;
        // First letter of the second parameter of the range
        let lastLetter = document.getElementById(y).id;
        let tablearea = document.getElementById('table-main');
        let rowNumber1, rowNumber2;
        let regex = /[+-]?\d+(?:\.\d+)?/g;
        let match1 = regex.exec(firstLetter);
        // Starting range while calculating for columns
        rowNumber1 = match1[0];
        regex.lastIndex = 0;
        let match2 = regex.exec(lastLetter);
        // Ending range while calculating for columns
        rowNumber2 = match2[0];
       
        // Check when the operation is for rows
        if (fnumber[1] == lnumber[1]) {
            let cellsarea = tablearea.rows[fnumber[1]].cells;
            for (let i = 0; i < str.length; i++) {
                // Get number equivalent of the letter which is the name of the column
                if (str[i] == firstLetter[0]) {
                    firstNumber = i + 1;
                }
                if (str[i] == lastLetter[0]) {
                    lastNumber = i + 1;
                }
            }
            // To calculate difference
            let value_1 = 0;
            for (let i = firstNumber; i <= lastNumber; i++) {
                let cellsVal1 = cellsarea[firstNumber].querySelector('input').value;
                // Only accept positive, negative and float numbers, else the value will be made 0
                if (cellsVal1 == "" || !cellsVal1.match(/^[-+]?[0-9]*\.?[0-9]+$/)) {
                    cellsVal1 = 0;
                }
                value_1 = parseFloat(cellsVal1);
                let val1 = cellsarea[i].querySelector('input').value;
                if (i > firstNumber) {
                    // Only accept positive, negative and float numbers, else the value will be made 0
                    if (val1 == "" || !val1.match(/^[-+]?[0-9]*\.?[0-9]+$/)) {
                        val1 = 0;
                        diff = "!ERR";
                       break;
                    }
                    diff -= parseFloat(val1);
                    value_1 = diff;
                }
                diff = value_1;
            }
            document.getElementById(id).querySelector('input').value = diff;
        
        }

        // Check when the operation is for columns
        else if (firstLetter[0] == lastLetter[0]) {
            let colNumber;
            for (let i = 0; i < str.length; i++) {
                // Get number value as the position of the letter in the column
                if (str[i] == firstLetter[0]) {
                    colNumber = i ;
                }
            }
            //To calculate difference
            let value_1 = 0;
            for (let j = parseInt(rowNumber1); j <= parseInt(rowNumber2); j++) {
                if (colNumber >= 0) {
                    let cellsVal2 = tablearea.rows[parseInt(rowNumber1)].querySelectorAll('td')[colNumber].querySelector('input').value;
                    // Only accept positive, negative and float numbers, else the value will be made 0
                    if (cellsVal2 == "" || !cellsVal2.match(/^[-+]?[0-9]*\.?[0-9]+$/)) {
                        cellsVal2 = 0;
                        diff = "!ERR";
                        break;
                    }
                    value_1 = parseFloat(cellsVal2);
                    let val2 = tablearea.rows[j].querySelectorAll('td')[colNumber].querySelector('input').value;
                    if (j > parseInt(rowNumber1)) {
                        // Only accept positive, negative and float numbers, else the value will be made 0
                        if (val2 == "" || !val2.match(/^[-+]?[0-9]*\.?[0-9]+$/)) {
                            val2 = 0;
                            diff = "!ERR";
                            break;

                        }
                        diff -= parseFloat(val2);
                        value_1 = diff;
                    }
                    diff = value_1;
                }
            }
        }
		return {id: id, diff: diff};
    }
})
.subscribe(data => {
	document.getElementById(data.id).querySelector('input').value = data.diff;
});


// Muliplication Calculation Subscription
calculateMul.map(d => {
	let {id, x, y} = d;
	let total = 0;
	if (x && y) {
        let str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let firstNumber;
        let lastNumber;
        // Row id of first parameter in the range
        let fnumber = document.getElementById(x).parentNode.id.split("_");
        // Row id of second parameter in the range
        let lnumber = document.getElementById(y).parentNode.id.split("_");
        // First letter of the first parameter of the range
        let firstLetter = document.getElementById(x).id;
        // First letter of the second parameter of the range
        let lastLetter = document.getElementById(y).id;
        let tablearea = document.getElementById('table-main');
        let rowNumber1, rowNumber2;
        let regex = /[+-]?\d+(?:\.\d+)?/g;
        let match1 = regex.exec(firstLetter);
        // Starting range while calculating for columns
        rowNumber1 = match1[0];
        regex.lastIndex = 0;
        let match2 = regex.exec(lastLetter);
        // Ending range while calculating for columns
        rowNumber2 = match2[0];
        // Check when the operation is for rows
        if (fnumber[1] == lnumber[1]) {
            let cellsarea = tablearea.rows[fnumber[1]].cells;
            for (let i = 0; i < str.length; i++) {
                // Get number equivalent of the letter which is the name of the column
                if (str[i] == firstLetter[0]) {
                    firstNumber = i + 1;
                }
                if (str[i] == lastLetter[0]) {
                    lastNumber = i + 1;
                }
            }
            //  To calculate multiplication
            let value_1 = 0;
            for (let i = firstNumber; i <= lastNumber; i++) {
                let cellsVal1 = cellsarea[firstNumber].querySelector('input').value;
                // Only accept positive, negative and float numbers, else the value will be made 0
                if (cellsVal1 == "" || !cellsVal1.match(/^[-+]?[0-9]*\.?[0-9]+$/)) {
                    cellsVal1 = 0;
                }
                value_1 = parseFloat(cellsVal1);
                if (i > firstNumber) {
                    let val1 = cellsarea[i].querySelector('input').value;
                    // Only accept positive, negative and float numbers, else the value will be made 0
                    if (val1 == "" || !val1.match(/^[-+]?[0-9]*\.?[0-9]+$/)) {
                        val1 = 0;
                        total = "!ERR";
                       break;
                    }
                    total *= parseFloat(val1);
                    value_1 = total;
                }
                total = value_1;
            }
       
        }
         // Check when the operation is for columns
         else if (firstLetter[0] == lastLetter[0]) {
            let colNumber;
            for (let i = 0; i < str.length; i++) {
                // Get number value as the position of the letter in the column
                if (str[i] == firstLetter[0]) {
                    colNumber = i ;
                }
            }
            //  To calculate multiplication
            let value_1 = 0;
            for (let j = parseInt(rowNumber1); j <= parseInt(rowNumber2); j++) {
                let cellsVal2 = tablearea.rows[parseInt(rowNumber1)].querySelectorAll('td')[colNumber].querySelector('input').value;
                // Only accept positive, negative and float numbers, else the value will be made 0
                if (cellsVal2 == "" || !cellsVal2.match(/^[-+]?[0-9]*\.?[0-9]+$/)) {
                    cellsVal2 = 0;
                }
                if (colNumber >= 0) {
                    value_1 = parseFloat(cellsVal2);
                    let val2 = tablearea.rows[j].querySelectorAll('td')[colNumber].querySelector('input').value;
                    // Only accept positive, negative and float numbers, else the value will be made 0
                    if (val2 == "" || !val2.match(/^[-+]?[0-9]*\.?[0-9]+$/)) {
                        val2 = 0;
                        total = "!ERR";
                        break;
                    }
                    if (j > parseInt(rowNumber1)) {

                        total *= parseFloat(val2);
                        value_1 = total;
                    }
                    total = value_1;
                }
            }
        }
		return {id: id, mul: total}
    }
})
.subscribe(data => {
	document.getElementById(data.id).querySelector('input').value = data.mul;
});

// Division Calculation Subscription
calculateDiv.map(d => {
	let {id, x, y} = d;
	let total = 0;
	if (x && y) {
        let str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let firstNumber;
        let lastNumber;
        // Row id of first parameter in the range
        let fnumber = document.getElementById(x).parentNode.id.split("_");
        // Row id of second parameter in the range
        let lnumber = document.getElementById(y).parentNode.id.split("_");
        // First letter of the first parameter of the range
        let firstLetter = document.getElementById(x).id;
        // First letter of the second parameter of the range
        let lastLetter = document.getElementById(y).id;
        let tablearea = document.getElementById('table-main');
        let rowNumber1, rowNumber2;
        let regex = /[+-]?\d+(?:\.\d+)?/g;
        let match1 = regex.exec(firstLetter);
        // Starting range while calculating for columns
        rowNumber1 = match1[0];
        regex.lastIndex = 0;
        let match2 = regex.exec(lastLetter);
        // Ending range while calculating for columns
        rowNumber2 = match2[0];
        // Check when the operation is for rows
        if (fnumber[1] == lnumber[1]) {
            let cellsarea = tablearea.rows[fnumber[1]].cells;
            for (let i = 0; i < str.length; i++) {
                // Get number equivalent of the letter which is the name of the column
                if (str[i] == firstLetter[0]) {
                    firstNumber = i + 1;
                }
                if (str[i] == lastLetter[0]) {
                    lastNumber = i + 1;
                }
            }
            //  To calculate division
            let value_1 = 0;

            for (let i = firstNumber; i <= lastNumber; i++) {
                let cellsVal1 = cellsarea[firstNumber].querySelector('input').value;
                // Only accept positive, negative and float numbers, else the value will be made 0
                if (cellsVal1 == 0 || cellsVal1 == "" || !cellsVal1.match(/^[-+]?[0-9]*\.?[0-9]+$/)) {
                    cellsVal1 = 0;
                    total = "!ERR";
                    break;
                }
                value_1 = parseFloat(cellsVal1);
                if (i > firstNumber) {
                    let val1 = cellsarea[i].querySelector('input').value;
                    // Only accept positive, negative and float numbers, else the value will be made 0
                    if (val1 == "" || !val1.match(/^[-+]?[0-9]*\.?[0-9]+$/)) {
                        val1 = 0;
                    }
                    total /= parseFloat(val1);
                    value_1 = total;
                }
                total = value_1;
                if(isNaN(total)) {
                    total = 0;
                    total = "!ERR";
                    break;
                }
            }
        // Check when the operation is for columns
        } else if (firstLetter[0] == lastLetter[0]) {
            let colNumber;
            for (let i = 0; i < str.length; i++) {
                // Get number value as the position of the letter in the column
                if (str[i] == firstLetter[0]) {
                    colNumber = i ;
                }
            }
            //  To calculate division
            let value_1 = 0;
            for (let j = parseInt(rowNumber1); j <= parseInt(rowNumber2); j++) {
                if (colNumber >= 0) {
                    let cellsVal2 = tablearea.rows[parseInt(rowNumber1)].querySelectorAll('td')[colNumber].querySelector('input').value;
                    // Only accept positive, negative and float numbers, else the value will be made 0
                    if (cellsVal2 == 0 || cellsVal2 == "" || !cellsVal2.match(/^[-+]?[0-9]*\.?[0-9]+$/)) {
                        cellsVal2 = 0;
                        total = "!ERR";
                        break;
                    }
                    value_1 = parseFloat(cellsVal2);
                    if (j > parseInt(rowNumber1)) {
                        let val2 = tablearea.rows[j].querySelectorAll('td')[colNumber].querySelector('input').value;
                        // Only accept positive, negative and float numbers, else the value will be made 0
                        if (val2 == "" || !val2.match(/^[-+]?[0-9]*\.?[0-9]+$/)) {
                            val2 = 0;
                        }
                        total /= parseFloat(val2);
                        value_1 = total;
                    }
                    total = value_1;
                }
                if(isNaN(total)) {
                    total = 0;
                    total = "!ERR";
                    break;
                }
            }
        }
		return {id: id, div: total == Infinity ? "!ERR": total};
    }
})
.subscribe(data => {
	document.getElementById(data.id).querySelector('input').value = data.div;
});



getFirstLastCellNo = (x,y) => {
  let str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";	
  // Row id of first parameter in the range	
  let fnumber = document.getElementById(x).parentNode.id.split("_");	
  // Row id of second parameter in the range	
  let lnumber = document.getElementById(y).parentNode.id.split("_");	
  // First letter of the first parameter of the range	
  let firstLetter = document.getElementById(x).id;	
  // First letter of the second parameter of the range	
  let lastLetter = document.getElementById(y).id;
  let tablearea = document.getElementById('table-main');
  let regex = /[+-]?\d+(?:\.\d+)?/g;	
  let match1 = regex.exec(firstLetter);	
  // Starting range while calculating for columns	
  rowNumber1 = match1[0];	
  regex.lastIndex = 0;	
  let match2 = regex.exec(lastLetter);	
  // Ending range while calculating for columns	
  rowNumber2 = match2[0];	
  // Check when the operation is for rows	
  if (fnumber[1] == lnumber[1]) {	
      let cellsarea = tablearea.rows[fnumber[1]].cells;	
      for (let i = 0; i < str.length; i++) {	
          // Get number equivalent of the letter which is the name of the column	
          if (str[i] == firstLetter[0]) 
              firstNumber = i + 1;	
          if (str[i] == lastLetter[0]) 
              lastNumber = i + 1;	
          
      }
    }
    return {f: firstNumber, l: lastNumber,r1:rowNumber1,r2:rowNumber2};
}

createFormulaBar = () => {
    const tr = document.createElement("tr");
    tr.setAttribute("id", "formulaBar");
    const th = document.createElement("td");
    cellEventHandlers(th);
    th.setAttribute("class", "column-header");
    th.contentEditable = true;
    tr.appendChild(th);
    return tr;

}

addCol =() => {
   let tr = document.getElementById('h-0');
    var letter = String.fromCharCode("A".charCodeAt(0)+defaultColCount-1);
    const th = document.createElement("th");
   
    th.setAttribute("id", `h-${defaultColCount}`);
    th.setAttribute("class", "column-header");
    th.innerHTML = letter;
    const span = document.createElement("span");
    span.setAttribute("class", "column-header-span");
    th.appendChild(span);
    
    tr.appendChild(th);
    for(i=1;i<=defaultRowCount;i++){
      var letter = String.fromCharCode("A".charCodeAt(0)+defaultColCount-1);
      let cr = letter + i;let rowID ="tr_" + i;
      let row = document.getElementById(rowID);
      const cell = document.createElement("td");
      cellEventHandlers(cell);
      let x = document.createElement("INPUT");
       x.setAttribute("type", "text");
      cell.appendChild(x);
      cell.setAttribute("id", cr);
      // cell.id = `${rowNum}-${i}`;
      row.appendChild(cell);
    }


}

createHeaderRow = () => {
  const tr = document.createElement("tr");
  tr.setAttribute("id", "h-0");
  for (let i = 0; i <= defaultColCount; i++) {
    var letter = String.fromCharCode("A".charCodeAt(0)+i-1);
    const th = document.createElement("th");
   
    th.setAttribute("id", `h-${i}`);
    th.setAttribute("class", `${i === 0 ? "" : "column-header"}`);
    th.innerHTML = i === 0 ? `` : `${letter}`;
    if (i !== 0) {
      const span = document.createElement("span");
     // span.innerHTML = `${letter} ${i}`;
      span.setAttribute("class", "column-header-span");
      th.appendChild(span);
    }
    tr.appendChild(th);
  }
  return tr;
};

createTableBodyRow = rowNum => {
  const tr = document.createElement("tr");
  tr.setAttribute("id", "tr_" + rowNum);
  for (let i = 0; i <= defaultColCount; i++) {
    var letter = String.fromCharCode("A".charCodeAt(0)+i-1);
    const cell = document.createElement(`${i === 0 ? "th" : "td"}`);
    
    if (i === 0) {
      cell.contentEditable = false;
      const span = document.createElement("span");
      span.innerHTML = rowNum;

      cell.appendChild(span);
      cell.setAttribute("class", "row-header");
    } 
    else
    {
      cellEventHandlers(cell);
      let x = document.createElement("INPUT");
       x.setAttribute("type", "text");
      cell.appendChild(x);
      //cell.contentEditable = true;
    }
    cell.setAttribute("id", `${letter}${rowNum}`);
    // cell.id = `${rowNum}-${i}`;
    tr.appendChild(cell);
  }
  return tr;
};

createTableBody = tableBody => {
  for (let rowNum = 1; rowNum <= defaultRowCount; rowNum++) {
    tableBody.appendChild(this.createTableBodyRow(rowNum));
  }
};

createSpreadsheet = (event) => {

    defaultRowCount =  defaultRowCount;
    defaultColCount =  defaultColCount;
  
    const tableHeaderElement = document.getElementById("table-headers");
    const tableBodyElement = document.getElementById("table-body");
    const addRow = document.getElementById('addRow');
    const addCol = document.getElementById('addCol');
    const deleteRow = document.getElementById('deleteRow');
    const deleteCol = document.getElementById('deleteCol');
    const tableBody = tableBodyElement.cloneNode(true);
    tableBodyElement.parentNode.replaceChild(tableBody, tableBodyElement);
    const tableHeaders = tableHeaderElement.cloneNode(true);
    tableHeaderElement.parentNode.replaceChild(tableHeaders, tableHeaderElement);
  
    tableHeaders.innerHTML = "";
    tableBody.innerHTML = "";

   // tableHeaders.appendChild(createFormulaBar());
    tableHeaders.appendChild(createHeaderRow(defaultColCount));
    createTableBody(tableBody, defaultRowCount, defaultColCount);
  
    
  
    // attach focusout event listener to whole table body container
    tableBody.addEventListener("focusout", function(e) {
      if (e.target && e.target.nodeName === "TD") {
       
      }
    });

    addRow.addEventListener("click", () => {
        defaultRowCount++;
        tableBody.appendChild(this.createTableBodyRow(defaultRowCount));
      });

    addCol.addEventListener("click", () => {
        defaultColCount++;
        this.addCol();
        //tableHeaders.appendChild(createHeaderRow(defaultColCount));
    });
    deleteRow.addEventListener("click", () => {
      let id = "tr_" +defaultRowCount;
      document.getElementById(id).remove()
      defaultRowCount--;
      
    });

    deleteCol.addEventListener("click", () => {
      let id = "h-" +defaultColCount;
      document.getElementById(id).remove()
      for(i=1;i<=defaultRowCount;i++){
        var letter = String.fromCharCode("A".charCodeAt(0)+defaultColCount-1);
        let cr = letter + i;
        document.getElementById(cr).remove()

      }
      defaultColCount--;
    });
  
  };
 
  window.onload = function (event) {
    createSpreadsheet(event);
};




///////////////////////////////////////////////////////////////////////

let exportToCSV = document.getElementById("exportTableToCSV");
exportToCSV.addEventListener('click', exportTableToCSV);

let upload=document.getElementById("upload");
upload.addEventListener('click', Upload);


//Export to CSV Functions
function downloadCSV(csv, filename) {
  let csvFile;
  let downloadFile;

  // CSV file
  csvFile = new Blob([csv], {
      type: "text/csv"
  });
  if (navigator.msSaveBlob) {    
      navigator.msSaveBlob(csvFile, filename);
  }
  else
  {
      downloadFile = document.createElement("a");      // Download link
      downloadFile.download = filename;// File name    
      downloadFile.href = window.URL.createObjectURL(csvFile);// Create a link to the file    
      downloadFile.style.display = "none";// Hide download link    
      document.body.appendChild(downloadFile);// Add the link to DOM   
      downloadFile.click(); // Click download link
  }
}

//Export CSV Main Function
function exportTableToCSV(event) {
  if (event.isTrusted) {
      let filename = 'spreadsheet.csv';
      let csv = [];
      let rows = document.querySelectorAll("table tr");

      for (let i = 0; i < rows.length; i++) {
          let row = [];
          if (i > 0) {
              let cols = rows[i].querySelectorAll("td");
              for (let j = 0; j <= cols.length; j++) {
                  if (j > 0) {
                      cols = rows[i].querySelectorAll("td input");
                      row.push(cols[j - 1].value);
                  } else {
                      row.push(cols[j].innerText);
                  }
              }
          }
          else {
              let cols = rows[i].querySelectorAll("th");
              for (let j = 0; j < cols.length; j++) {
                  row.push(cols[j].innerText);
              }
          }
          csv.push(row.join(","));
      }

      // Download CSV file
      downloadCSV(csv.join("\n"), filename);
  }
}

function Upload() {
    
        
  var fileUpload = document.getElementById("fileUpload");
  var regex = /^([a-zA-Z0-9\s_\\.\-:])+(.csv|.txt)$/;
  if (regex.test(fileUpload.value.toLowerCase())) {
      if (typeof (FileReader) != "undefined") {
          var reader = new FileReader();
          reader.onload = function (e) {
              var table = document.createElement("table");
              var rows = e.target.result.split("\n");
              for(let i=0;i<rows.length;i++){
                  rows[i] = i==0?rows[i]:i+rows[i];
              }
              for (var i = 0; i < rows.length; i++) {
                  var cells = rows[i].split(",");
                  if (cells.length > 1) {
                      var row = table.insertRow(-1);
                      for (var j = 0; j < cells.length; j++) {
                          var cell = row.insertCell(-1);
                          cell.innerHTML = cells[j];
                      }
                  }
              }
              var dvCSV = document.getElementById("table-main");
              dvCSV.innerHTML = "";
              dvCSV.appendChild(table);
          }
          reader.readAsText(fileUpload.files[0]);
      } 
      else {
          alert("This browser does not support HTML5.");
      }
  } 
  else {
      alert("Please upload a valid CSV file.");
  }
}