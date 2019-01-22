/***************************************
 * ***********DATA HANDLER**************
 */

var dataHandler = (function(){
    var currentList = [];
    localStorage.clear();

    var favouriteList = new Map();

    //function constructor to create new item from search result
    function NewItem(id,title,body){
        this.id = id;
        this.title = title;
        this.description = body;
    }


    //returns a boolean value if there is a match in keyword
    let keywordFinder = function(keywords, index, inputV){
        let keywordArr = [];
        let insert = false;
        keywordArr = keywords.split(', ');

        keywordArr.forEach(keywrd => {
            if(keywrd.indexOf(inputV) !== -1){
                insert = true;
            }
        });

        return insert;
    }

    return {
        jsonData: function(inputVal){
            //fall back to empty array on new search
            currentList = [];
            localStorage.clear();
            //API call to JSON data resource
            let reqData = new XMLHttpRequest();
            reqData.open("GET", "https://secure.toronto.ca/cc_sr_v1/data/swm_waste_wizard_APR?limit=1000");
            reqData.send();

            reqData.onload = () =>{
                if(reqData.status === 200){
                    let data = JSON.parse(reqData.response);
                    localStorage.setItem('lookupData',JSON.stringify(data));
                    //fetch data from local storage
                    let localStore = JSON.parse(localStorage.getItem('lookupData'));

                    localStore.forEach((element,index) => {
                        let canInsert = keywordFinder(element.keywords,index,inputVal);
                        if(canInsert){
                            if(element.id !== undefined){
                                currentList.push(new NewItem(element.id,element.title,element.body));
                            }
                            else{
                                currentList.push(new NewItem(''+index,element.title,element.body));
                            }
                        }
                    });
                }
            }
            
        },

        displayList: function(){
            return currentList;
        },

        clearList: function(){
            currentList = [];
        },

        favList: function(){
            return favouriteList;
        },

        favListAdd: function(id, item){
            favouriteList.set(id, item);
        },

        favListRemove: function(id){
            favouriteList.delete(id);
        }
    }
    
})();



/************************************************
 * *****************UI CONTROLLER*************
 */

var UIcontroller = (function(hData){

    var domList = {
        inputField: document.getElementById('search-input'),
        searchBtn: document.getElementById('search-button'),
        searchTable: document.getElementById('search-table'),
        favTable: document.getElementById('fav-table'),
        starIcon: document.getElementsByClassName('fa-star-search'),
        favIcon: document.getElementsByClassName('fa-star-event')
    }


    //Event listener for search items
    let addEvent = function(){
        Array.from(domList.starIcon).forEach(element => {
            element.addEventListener('click', function(){
            element.classList.toggle('fa-star-green');

            let parentId = element.parentNode.parentNode.id;
            let sibling = element.parentElement.parentElement.lastElementChild;
            
            //check if key exists or not
            if(hData.favList().has(parentId)){
                hData.favListRemove(parentId);
            }
            else{
                hData.favListAdd(parentId, {
                    title: sibling.previousElementSibling.innerHTML, 
                    description: sibling.innerHTML
                });
            }
            
            //update favourite list
            favDisplay();
            });
        });
    }


    //Event listener for favourited items
    let addFavEvent = function(){
        Array.from(domList.favIcon).forEach(element => {
            element.addEventListener('click', function(){
                let parentId = element.parentNode.parentNode.id;
                //get search element node id
                let pId = parentId.slice(3);
                //remove key-value pair from Map
                hData.favListRemove(pId);

                let node = document.getElementById(parentId);
                //remove element from favourite list
                node.parentNode.removeChild(node);
                //remove class to reflect icon change
                if(document.getElementById(pId))
                    document.getElementById(pId).firstElementChild.firstElementChild.classList.remove('fa-star-green');
                
            });
        });
        
    }

    let searchDisplay = function(){
        //fetch search data
        let list = hData.displayList();

        domList.searchTable.innerHTML = '';
        //loop fetched data and render display based on favourited
        list.forEach(element => {
            let iconClass = '';
            if(hData.favList().has(element.id)){
                iconClass = 'fa-star-green';
            }
            //replace escape characters
            element.description = element.description.split('&lt;').join('<').split('&gt;').join('>').split('&amp;nbsp;').join(' ').split('&quot;').join('"');
            domList.searchTable.innerHTML += `<tr id="${element.id}">
                <td class="table-cell cell1"><i class="fas fa-star fa-star-search ${iconClass}"></i></td>
                <td class="table-cell cell2">${element.title}</td>
                <td class="table-cell cell3">${element.description}</td>
            </tr>`; 

            
        });
        //add event listener
        addEvent();
    }

    //favourite list display
    let favDisplay = function(){
        let list = hData.favList();
        domList.favTable.innerHTML = '';

        list.forEach((value,key) => {
            domList.favTable.innerHTML += `<tr id="fav${key}">
                <td class="table-cell cell1"><i class="fas fa-star fa-star-green fa-star-event"></i></td>
                <td class="table-cell cell2">${value.title}</td>
                <td class="table-cell cell3">${value.description}</td>
            </tr>`; 
        });

        //add event to favourite items
        addFavEvent();
    }

    domList.inputField.addEventListener('keydown', function(e){
        if(e.code === 'Enter' || e.code === 'NumpadEnter'){
            e.preventDefault();
            //pass input value for keyword lookup
            if(e.target.value !== ''){
                hData.jsonData(e.target.value);
                //searchDisplay();
            }
            
        }
        else if(e.target.value === ''){
            hData.clearList();
            //domList.searchTable.innerHTML = '';
        }
        
    });

    domList.searchBtn.addEventListener('click', function(e){
            e.preventDefault();
            //pass input value for keyword lookup
            if(domList.inputField.value !== ''){
                hData.jsonData(domList.inputField.value);
                //searchDisplay();
            }
    });

    setInterval(function(){
        searchDisplay();
    },1000);

})(dataHandler);