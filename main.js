import van from "./van-0.12.1.min.js"

const BUTTONS = 4
const RESOLUTION = 512
const {a, div, li, p, ul, button, img, span} = van.tags

Array.prototype.random = function () {
    return this[Math.floor((Math.random()*this.length))];
}

const correctCounter = van.state(0)
const incorrectCounter = van.state(0)

var image = img({class: "module"})
var buttonsDiv = div({class: "module textmodule"})
var correct = span("✔️ ", correctCounter)
var incorrect = span("❌ ", incorrectCounter)
var succesDiv = div({class: "module textmodule"}, correct, incorrect)
var container = div({class: "container"}, image, buttonsDiv, succesDiv)
var buttons = []
var loading = false

van.add(document.body, container)

async function getFlowerList() {
    let flowerList = localStorage.getItem("flowerList")
    if (flowerList === null) {
        await getCategoryMembers()
        return JSON.parse(localStorage.getItem("flowerList"))
    }
    return JSON.parse(flowerList)
}

for (let i = 0; i < BUTTONS; i++) {
    buttons.push(button(""))
    van.add(buttonsDiv, buttons[i])
}

main()

async function main()
{
    var flowerList = await getFlowerList()
    var options = []
    var answer = ""
    newFlower()

    async function newFlower() {
        for (let i = 0; i < BUTTONS; i++) {
            options[i] = flowerList.random()    
        }
        answer = options.random()
        let imgUrl = await getImageUrl(answer, RESOLUTION)
        if (imgUrl == null) {
            newFlower()
            return
        }
        image.src = imgUrl;
        await onload2promise(image)

        for (let i = 0; i < BUTTONS; i++) {
            buttons[i].innerText = options[i] 
            if(options[i] == answer) {
                buttons[i].classList.add("correct")
                buttons[i].classList.remove("incorrect")
            }
            else {
                buttons[i].classList.add("incorrect")
                buttons[i].classList.remove("correct")
            }
            buttons[i].onclick = function() { makeGuess(options[i]) }
        }
    }

    async function makeGuess(guess) {
        if (!loading) {
            loading = true
            if (guess == answer) {
                ++correctCounter.val
                await newFlower()
            }
            else {
                ++incorrectCounter.val
            }
            loading = false
        }
    }
}

async function getImageUrl(flowerName, resolution)
{
    const response = await fetch(`https://cs.wikipedia.org/w/api.php?action=query&titles=${flowerName}&prop=pageimages&format=json&origin=*&pithumbsize=${resolution}`)
    var resJson = await response.json()
    return resJson.query.pages[Object.keys(resJson.query.pages)[0]].thumbnail.source
}

function onload2promise(obj){
    return new Promise((resolve, reject) => {
        obj.onload = () => resolve(obj);
        obj.onerror = reject;
    });
}

async function getCategoryMembers()
{
    const categoryName = "Kategorie:Fl%C3%B3ra_%C4%8Ceska"
    let categoryMembers = []
    let cmcontinue = ""
    while (true) {
        let url = `https://cs.wikipedia.org/w/api.php?action=query&list=categorymembers&cmlimit=max&format=json&origin=*&cmtitle=${categoryName}&cmcontinue=${cmcontinue}`
        let response = await fetch(url)
        let resp = await response.json()

        for (let i = 0; i < resp.query.categorymembers.length; i++) {
            const title = resp.query.categorymembers[i].title
            if (title.includes("Kategorie") || title.includes("(rod)")) continue
            categoryMembers.push(title)
        }
        if (resp.hasOwnProperty("continue")) {
            cmcontinue = resp.continue.cmcontinue
        }
        else {
            break
        }
    }
    localStorage.setItem("flowerList", JSON.stringify(categoryMembers))
}