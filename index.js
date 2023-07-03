const btn = document.querySelector('#btnvalide');
const name = document.querySelector('#name');
const pass = document.querySelector('#password');
const tableContent = document.querySelector('#tableContent');
const errorLogin   = document.querySelector('p');

btn.addEventListener("click", getinfo);

async function getinfo()
{
    errorLogin.innerHTML = '';

    const nameUser = name.value;
    const password = pass.value;
    

    const userInfo = await loginED(nameUser, password);
    
    if (!userInfo)
        return badLogin(); 


    const arrayWorks = await getWorks(userInfo);

    const arrMapped = await creatTable(arrayWorks);


    displayTable(arrMapped);
}

async function badLogin()
{
    errorLogin.innerHTML = 'Le mot de passe ou le nom d\'utilisateur n\'est correct';
}

async function loginED(name, pass)
{
    const request = await fetch("https://api.ecoledirecte.com/v3/login.awp",
        {
            method : "POST",
            body : `data={
                	"identifiant" : "${name}",
                	"motdepasse"  : "${pass}"
            }`
                
        }
    );


    const reponseHeaders = await request.headers;
    const reponseBody    = await request.json(); 
        
    console.log(reponseBody);
    if (reponseBody.code == 200)
         return { token : reponseHeaders.get("x-token"), id : reponseBody.data.accounts[0].id }
    else 
        return false;        
}


async function getWorks(info)
{
    let date = new Date();
    date.toISOString().split('T')[0];

    const offset = date.getTimezoneOffset();
    let dateTimeZone = new Date(date.getTime() - (offset*60*1000));
    dateTimeZone = dateTimeZone.toISOString().split("T")[0];
    let segDate = dateTimeZone.split("-");


    let relatifeStart = (dateTimeZone <= `${segDate[0]}-07-09`)? -1 : 0;
    let relatifeEnd   = (dateTimeZone <= `${segDate[0]}-07-09`)? 0 : 1;

    const request = await fetch(`https://api.ecoledirecte.com/v3/E/${info.id}/emploidutemps.awp?verbe=get`,
        {
            method : "POST",
            headers : {"X-Token" : info.token},
            body : `data={
	                "dateDebut": "${parseInt(segDate[0]) + relatifeStart}-09-01",
	                "dateFin": "${parseInt(segDate[0]) + relatifeEnd}-07-09",
	                "avecTrous": false
                }
                `
        }
    );


    return await request.json()
}


async function creatTable(arrTable)
{
    const arr = [];
    const tableProf = arrTable.data

    let notfind = true;
   
    for (let i = 0; i < tableProf.length; i++) 
    {  

        notfind = true;

        const pres = (!(tableProf[i].isAnnule)) ? 1 : 0;
        const abs = (tableProf[i].isAnnule) ? 1 : 0; 

        for (let k = 0; k < arr.length; k++)
        {
            const narr = arr[k];

            if (arr[k].name == tableProf[i].prof) 
            {
                narr.pres += pres;
                narr.abs += abs;
                narr.tot += 1;
                
                notfind = false;
                break
            }       
        }

        if (notfind && tableProf[i].prof)
        {
            const newProf = 
            {
                name : tableProf[i].prof,
                pres : pres, 
                abs  : abs,
                tot  : 1,
                ras : 0
            }
        
            arr.push(newProf);
        }

    }
    
    for (let k = 0; k < arr.length; k++)
    {
        const narr = arr[k];
        
        narr.ras = (narr.pres / narr.tot)*100;
    }
    
    arr.sort((a, b) => {
        if (a.ras < b.ras)
            return -1;
        if (a.ras > b.ras)
            return 1;

        return 0;

    });

    return arr;
}

async function displayTable(arr) 
{
    let classement = 1;
    let pos        = 100; 

    tableContent.innerHTML =
    `
        <tr>
            <th>Classement</th>
            <th>Prof</th>
            <th>Présent</th>
            <th>Absent</th>
            <th>Total</th>
            <th>Ratio de présence</th>
        </tr>
    `

    for (let k = 0; k < arr.length; k++)
    {
        const narr = arr[k];
        
        if (narr.ras > pos)
            classement++

        pos = narr.ras;
    

        const innerTable = 
        `
            <tr>
                <td>${classement}</td>
                <td>${narr.name}</td>
                <td>${narr.pres}</td>
                <td>${narr.abs}</td>
                <td>${narr.tot}</td>
                <td>${narr.ras}</td>
            </tr> 
        `;

        tableContent.insertAdjacentHTML("beforeend", innerTable);
    }
}
