// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: magic;
// This app uses the data from "https://gas.didnt.work/?country=" in order to show gas prices
// Programmeeritud Eestis 🇪🇪 - Rikolan

// If initiated from Scriptable app, it will display choices. Otherwise it will remember user choice
const countries = ["ee", "lv", "lt"];
const countries_full = ["🇪🇪 Eesti", "🇱🇻 Latvija", "🇱🇹 Lietuva"];
let highlight = "#e3e3e3";
let station_brands = [];
let days = [["Täna", "Šodien", "Šiandien"], ["Eile", "Vakar", "Vakar"], ["Üleeile", "Aizvakar", "Užvakar"]];
let days_colors = ["#77dd77", "#84b6f4", "#fdfd96", "#ff6969"];
let brand_colors = ["#ffffff", "#404040", "#272727", "#de3d3d", "#bb3434", "#9e2323", "#f6d566", "#f2c11c", "#d4a609", "#95cc7d", "#66b943", "#3e8c1c", "#6ed9e0", "#2ec1cb", "#15aab3", "#82acf0", "#3f7bde", "#1652b5", "#c382f0", "#8e4cbc", "#653487"];

// Checks if system is in dark mode
if (Device.isUsingDarkAppearance()) {
  highlight = "#212121";
}


// Gets the actual gas station data
async function get_all_data(url_string) {
  let proper_list = [];
  let i = 0;
  
  try {
    let url_req = new Request(url_string);
    const response = await url_req.loadString();
		
    // Extract cities and stations inside <div class="container">
    let full_list = response.match(/<tbody[^>]*>[\s\S]*?<\/tbody>/gi);
    full_list = full_list ? full_list[0] : '';
    
    stuff = full_list.match(/<td[^>]*>[\s\S]*?<\/td>/gi);
    stuff = stuff.map(option => option.replace(/<td[^>]*>/gi, '').replace(/<\/td>/gi, ''));
    
    
    while (stuff[i] != null) {
      let location = [];
      let gas = [];
      
      for (let x = 0; x < 5; x++) {
        if (x == 0) {
          
          let holder = stuff[i];
          
          holder = stuff[i].split(/<br>/gi);
          holder = holder[0].replaceAll("  ", "");
          let loc_station = holder;
          
          holder = stuff[i].match(/<small[^>]*>[\s\S]*?<\/small>/gi);
          let aadress = holder[x].replace(/<small>/gi, '').replace(/<\/small>/gi, '').split(", ");
          
          holder = stuff[i].match(/<span[^>]*>[\s\S]*?<\/span>/gi);
          let time = holder[x].replace(/<span[^>]*>/gi, '').replace(/<\/span>/gi, '').replaceAll(" ", "").replaceAll("\n", "");

					location = [loc_station, aadress[1], aadress[0], time];
          
        } else if (x < 4) {
          gas.push(stuff[i]);
          
        } else {
          gas.push(stuff[i])
          holder = [location, gas];
          proper_list.push(holder);
          
        }
        i++;
      }
    }
  } catch (error) {
    console.log("That's a null!");
    proper_list = null;
  }
  return proper_list;
}


// Creates UITables and gets user input and data from the web
async function data_selection() {
  try {
  
    // Displays a list of countries
    async function country() {
      let table = new UITable();
      let index = null;
    	table.showSeparators = true;
    
      for (let i = 0; i < countries_full.length; i++) {
        let row = new UITableRow();
        row.dismissOnSelect = true;
        row.onSelect = () => {index = i};
        row.addText(countries_full[i]);
        table.addRow(row);
    	}
    
    	await table.present(true);
      return index
    }
    
    
    let sel_country = await country();
    let url_line = "";
    
    // Checks if the user cancelled
    if (sel_country == null) {
      url_line = null;
      return;
    } else {
      url_line = 'https://gas.didnt.work/?country=' + countries[sel_country]
    }
    
    
    // Cleanse the stations and cities list
    async function select_data() {
    	let select = [];
      try {
        let url1 = new Request(url_line);
        const response = await url1.loadString();
        
        // Extract cities and stations inside <div class="container">
        let selectRegex = response.match(/<select[^>]*>[\s\S]*?<\/select>/gi);
        let stations = selectRegex ? selectRegex[0] : '';
        
        // cleans the stations from tags
        stations = stations.match(/<option[^>]*>[\s\S]*?<\/option>/gi);
        stations = stations.map(option => option.replace(/<[^>]*>/g, ''));
        
        select = stations;
        
      } catch (error) {
        console.log("Error");
      }
      return select;
    }
    
    
    // List of stations and cities
    let stations = await select_data();
    station_brands = stations;
    
    
    // Displays a list of stations
    async function select_stations() {
      let table = new UITable();
      let index = null;
    	table.showSeparators = true;
    
      for (let i = 0; i < stations.length; i++) {
        let row = new UITableRow();
        row.dismissOnSelect = true;
        row.onSelect = () => {index = i};
        row.addText(stations[i]);
        (i < 2) ? row.backgroundColor = new Color(highlight) : null;
        table.addRow(row);
    	}
    
    	await table.present(true);
      return index
    }
    
    
    let sel_station = await select_stations();
    if (sel_station == 0) {
      sel_station = "";
    } else if (sel_station == 1) {
      sel_station = "-";
    } else {
      sel_station = stations[sel_station];
    	sel_station = sel_station.replaceAll(" ", "+").replaceAll("(", "%28").replaceAll(")", "%29").replaceAll(",", "%2C");
    }
    
    
    url_line_full = url_line + "&brand=" + sel_station + "&city=";
    let all_data = await get_all_data(url_line_full);
    
    
    // Displays a list of available gas stations - if there aren't any, "No data" will be displayed
    async function select_station_loc() {
      let table = new UITable();
      let index = null;
    	table.showSeparators = true;
    	
      if (all_data == null) {
        let row = new UITableRow();
          row.dismissOnSelect = true;
          row.onSelect = () => {all_data = null};
          row.addText("Andmed puuduvad / Nav datu / Nėra duomenų");
          table.addRow(row);
        
      } else {
        for (let i = 0; i < all_data.length; i++) {
          let row = new UITableRow();
          row.dismissOnSelect = true;
          row.onSelect = () => {index = i};
          row.addText(all_data[i][0][0] + " - " + all_data[i][0][1] + ", " + all_data[i][0][2]);
          table.addRow(row);
    		}
      }
      
    	await table.present(true);
      
      if (all_data == null) {
        return null;
      } else {
        return all_data[index];
      }
    }
    
    
    // Displays a list of colors
    async function select_color() {
      let table = new UITable();
      let index = null;
    	table.showSeparators = true;
    
      for (let i = 0; i < brand_colors.length; i++) {
        let row = new UITableRow();
        row.dismissOnSelect = true;
        row.onSelect = () => {index = i};
        //row.addText(brand_colors[i]);
        row.backgroundColor = new Color(brand_colors[i]);
        table.addRow(row);
    	}
    
    	await table.present(true);
      return index
    }
    let selected = await select_station_loc();
    let color = null;
    if (selected != null) {
      color = await select_color();
    }
    
    if (color != null) {
      let group = [selected, url_line_full, color];
    	return group;
    }
    
	} catch(error) {
    console.log("Error caught");
  }
}


//------------------------------------------------------------------------------------------------


// Check for internet connection
async function hasInternet() {
  try {
    let url = new Request('https://gas.didnt.work/?country=');
    let response = await url.loadString();
    return true;
  } catch (error) {
    return false;
  }
}


// Checks if app is run inside Scriptable or as a widget outside the app
let station_data = [];
let url = "";
let brand = "";
let brand_color = 0;

if (config.runsInApp) {
  let isConnected = await hasInternet();
  
  if (isConnected) {
    let info = await data_selection();
    if (info != null) {
      station_data = info[0];
  		url = info[1];
      brand_color = info[2];
  		
      for (let i = 0; i < station_brands.length; i++) {
        if (station_data[0][0].includes(station_brands[i])) {
          brand = station_brands[i];
          break;
        }
      }
      
      let data = [station_data, url, brand, brand_color];
      console.log(data);
      
      // Create a new script with given parameters
			let script_name = brand + " " + station_data[0][2] + ".js";
			let fm = FileManager.iCloud();
      let dir = fm.documentsDirectory();
      let path = fm.joinPath(dir, script_name);
      let contents = `
// If initiated from Scriptable app, it will display choices. Otherwise it will remember user choice
const countries = ["ee", "lv", "lt"];
const countries_full = ["🇪🇪 Eesti", "🇱🇻 Latvija", "🇱🇹 Lietuva"];
let highlight = "#e3e3e3";
let station_brands = [];
let days = [["Täna", "Šodien", "Šiandien"], ["Eile", "Vakar", "Vakar"], ["Üleeile", "Aizvakar", "Užvakar"]];
let days_colors = ["#77dd77", "#84b6f4", "#fdfd96", "#ff6961"];
let brand_colors = ["#ffffff", "#404040", "#272727", "#de3d3d", "#bb3434", "#9e2323", "#f6d566", "#f2c11c", "#d4a609", "#95cc7d", "#66b943", "#3e8c1c", "#6ed9e0", "#2ec1cb", "#15aab3", "#82acf0", "#3f7bde", "#1652b5", "#c382f0", "#8e4cbc", "#653487"];

// Checks if system is in dark mode
if (Device.isUsingDarkAppearance()) {
  highlight = "#212121";
}


let data = [[["`+ data[0][0][0] + `", "`+ data[0][0][1] + `", "`+ data[0][0][2] + `", "`+ data[0][0][3] + `"], ["` + data[0][1][0] + `", "` + data[0][1][1] + `", "` + data[0][1][2] + `", "` + data[0][1][3] + `"]], "` + data[1] + `", "` + data[2] + `", ` + data[3] + `];


//------------------------------------------------------------------------------------------------


// Gets the actual gas station data
async function get_all_data(url_string) {
  let proper_list = [];
  let i = 0;
  
  try {
    let url_req = new Request(url_string);
    const response = await url_req.loadString();
		
    // Extract cities and stations inside <div class="container">
    let full_list = response.match(/<tbody[^>]*>[\\s\\S]*?<\\/tbody>/gi);
    full_list = full_list ? full_list[0] : '';
    
    stuff = full_list.match(/<td[^>]*>[\\s\\S]*?<\\/td>/gi);
    stuff = stuff.map(option => option.replace(/<td[^>]*>/gi, '').replace(/<\\/td>/gi, ''));
    
    
    while (stuff[i] != null) {
      let location = [];
      let gas = [];
      
      for (let x = 0; x < 5; x++) {
        if (x == 0) {
          
          let holder = stuff[i];
          
          holder = stuff[i].split(/<br>/gi);
          holder = holder[0].replaceAll("  ", "");
          let loc_station = holder;
          
          holder = stuff[i].match(/<small[^>]*>[\\s\\S]*?<\\/small>/gi);
          let aadress = holder[x].replace(/<small>/gi, '').replace(/<\\/small>/gi, '').split(", ");
          
          holder = stuff[i].match(/<span[^>]*>[\\s\\S]*?<\\/span>/gi);
          let time = holder[x].replace(/<span[^>]*>/gi, '').replace(/<\\/span>/gi, '').replaceAll(" ", "").replaceAll("\\n", "");

					location = [loc_station, aadress[1], aadress[0], time];
          
        } else if (x < 4) {
          gas.push(stuff[i]);
          
        } else {
          gas.push(stuff[i])
          holder = [location, gas];
          proper_list.push(holder);
          
        }
        i++;
      }
    }
  } catch (error) {
    console.log("That's a null!");
    proper_list = null;
  }
  return proper_list;
}


//------------------------------------------------------------------------------------------------


// Check for internet connection
async function hasInternet() {
  try {
    let url = new Request('https://gas.didnt.work/?country=');
    let response = await url.loadString();
    return true;
  } catch (error) {
    return false;
  }
}


//Save the data as cache
let cacheKey = "statCacheKey";
const cachePath = FileManager.local().joinPath(FileManager.local().cacheDirectory(), cacheKey);

async function station_data_cache(s_d, u_d, b_d, bc_d) {
  // store the data into a cache
	let data = [s_d, u_d, b_d, bc_d];
  let data_json = JSON.stringify(data);
  
  // Save the data
  FileManager.local().writeString(cachePath, data_json);
}



// Checks if app is run inside Scriptable or as a widget outside the app
let station_data = data[0];
let url = data[1];
let brand = data[2];
let brand_color = data[3];


// cache the data
await station_data_cache(station_data, url, brand, brand_color);




// Widget creation
let widget = new ListWidget();

// Stack division
let main = widget.addStack();
main.layoutVertically();
main.centerAlignContent();

main.addSpacer(5);
let stack1 = main.addStack();
main.addSpacer(3);
let stack3 = main.addStack();
main.addSpacer(5);

// Runs the widget, if there is cache to work with
let data_cache = JSON.parse(FileManager.local().readString(cachePath));
if (data_cache != null) {
  station_data = data_cache[0];
  url = data_cache[1];
  brand = data_cache[2];
  brand_color = data_cache[3];
  
  chosen_color = brand_colors[brand_color];
  title_color = "#ffffff";
  updated = false;
  
  // Set widget background color
	widget.backgroundColor = new Color(chosen_color);
  
  // Check for fitting main text color
	if (brand_color % 3 == 0) {
    title_color = "#000000";
  }
  
  // Update the info, if there's internet
	let isConnected = await hasInternet();
  if (isConnected) {
    let proper_list = await get_all_data(url);
    
    for (let i = 0; i < station_data[0].length; i++) {
        if (station_data[0][i] == "undefined") {
          station_data[0][i] = null;
        }
      }
      
    
    for (let i = 0; i < proper_list.length; i++) {
      if ((proper_list[i][0][0] == station_data[0][0]) && (proper_list[i][0][1] == station_data[0][1]) && (proper_list[i][0][1] == station_data[0][1])) {
        
        station_data = proper_list[i];
        await station_data_cache(station_data, url, brand, brand_color);
        updated = true;
        console.log(days);
        break;
      }
    }
  }
  
  let station_data_string = "";
  
  if (station_data[0][1] != null) {
    station_data_string = station_data[0][1].toString();
  }
  if (station_data[0][2] != null) {
    if (station_data_string == "") {
      station_data_string = station_data[0][2].toString();
    } else {
      station_data_string = station_data_string + ", " + station_data[0][2].toString();
    }
  }
  
  let location = station_data_string;
  let gasses = station_data[1];
  let gas_font = "Menlo-Bold"; //DINAlternate-Bold
  let types = ["D", "95", "98", "LPG"];
  
  
  // if brand is empty, it will be replaced with station data
  let text1_text = "";
  if (brand.length < 1) {
    text1_text = station_data[0][0];
  } else {
    text1_text = brand;
  }
    
    
  // Text configuration - make it smaller if it's too big (12 is max)
  let text1_size = text1_text.length;
  let text1_fact = 1;
  if (text1_size > 20) {
    text1_fact = 10;
  } else if (text1_size > 10) {
    text1_fact = text1_size - 10;
  } else {
    text1_fact = 0;
  }
  
  stack1.size = new Size(140, 23 - text1_fact);
  stack3.size = new Size(140, 12);
  
  let stack3_box = stack3.addStack();
  
  let text1 = stack1.addText(text1_text);
  
  
  // Check if date is updated from the web
	if (updated) {
    let text3 = stack3_box.addText(station_data[0][3]);
    stack3_box.size = new Size(8 * (station_data[0][3].length), 12);
    text3.font = Font.systemFont(10);
    stack3_box.cornerRadius = 5;
    let index = null;
    
    for (let i = 0; i < days.length; i++) {
      for (let x = 0; x < days[i].length; x++) {
        if (station_data[0][3] == days[i][x]) {
        	index = i;
        }
      }
    }
    
    text3.textColor = new Color("#000000", 0.5);
    if (index != null) {
    	stack3_box.backgroundColor = new Color(days_colors[index]);
      
    } else {
    	stack3_box.backgroundColor = new Color(days_colors[3]);
    }
    
    
    
  } else {
    let text3 = stack3_box.addText("⚠️");
    stack3_box.size = new Size(20, 12);
    text3.font = Font.systemFont(10);
  }
  

  text1.font = Font.boldSystemFont(20 - text1_fact);
  text1.textColor = new Color(title_color);
  
  
  for (let i = 0; i < 4; i++) {
    let stack_box = main.addStack();
    stack_box.layoutHorizontally();
    stack_box.addSpacer(15);
    
    let stack = stack_box.addStack();
    stack.layoutHorizontally();
    
    let stack_type = stack.addStack();
    let stack_price = stack.addStack();
    
    stack.backgroundColor = new Color("#000000", 0.5);
    stack.cornerRadius = 5;
    
    stack_type.size = new Size(40,19);
    stack_price.size = new Size(70, 19);
    stack_type.centerAlignContent();
    stack_price.centerAlignContent();
    
    stack_price.cornerRadius = 5;
    stack_price.backgroundColor = new Color("#000000");
    
    let type = stack_type.addText(types[i]);
    let price = stack_price.addText(gasses[i]);
    
    type.font = new Font("Menlo-Bold", 13);
    price.font = new Font("Menlo-Bold", 16);
    type.textColor = new Color("#ffffff");
    price.textColor = new Color("#ffffff");
    
    stack_box.addSpacer(15);
    main.addSpacer(3);
  }
  
  
  // Add location stack
  let stack2 = main.addStack();
  main.addSpacer(3);
  stack2.size = new Size(140, 10);
  let text2 = stack2.addText(location);
  text2.font = Font.systemFont(8);
  text2.textColor = new Color(title_color, 0.4);
  
  
}



// Present the widget
if (config.runsInApp) {
  // If running in the app, preview the widget
	widget.presentSmall();
} else {
  // If script is running in a widget, display the widget
	Script.setWidget(widget);
}

// End of script
Script.complete();`;
      fm.writeString(path, contents);
      
    }
  	
  } else {
    let myAlert = new Alert();
    myAlert.title = "No connection!";
    myAlert.message = "Could not connect to the internet. Please check you wifi or cellular connection."
    myAlert.addAction("OK");
    await myAlert.present();
  }
  
}


// End of script
Script.complete();