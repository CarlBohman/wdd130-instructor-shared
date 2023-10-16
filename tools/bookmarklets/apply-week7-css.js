javascript:
var css = `
header {
    display: grid;
    align-items: center;
    grid-template-columns: 150px auto;
    position: relative;
    z-index: 2;
}

#logo_link {
    padding-top: 5px;
    justify-self: center;
    align-self: center;
}

nav {
    display: flex;
    justify-content: space-around;
}

#hero {
    display: grid;
    grid-template-columns: 1fr 3fr 1fr;
    margin-top: -100px;
    text-align: center;
}

#hero-box {
    grid-column: 1/4;
    grid-row: 1/3;
    z-index: -1;
}

#hero-msg {
    grid-column: 2/3;
    grid-row: 1/2;
    margin-top: 100px;
}

.home-grid {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    justify-content: center;
}

.card-img,
.mountains {
    width: 100%;
}

.card-img {
    transition: transform .5s;
    box-shadow: 5px 5px 10px #6f7364;
}

.card-img:hover {
    opacity: .6;
    transform: scale(1.1);
}

.rivers-card {
    grid-column: 2/4;
    grid-row: 2;
}

.camping-card {
    grid-column: 5/7;
    grid-row: 2;
}

.rapids-card {
    grid-column: 8/10;
    grid-row: 2;
}

#background {
    grid-column: 1/-1;
    grid-row: 4/9;
}

.mountains {
    grid-column: 2/7;
    grid-row: 5/8;
    box-shadow: 5px 5px 10px #6f7364;
}

.msg {
    line-height: 1.5em;
    padding: 35px;
    grid-column: 6/10;
    grid-row: 6/7;
    box-shadow: 5px 5px 10px #6f7364;
}

footer {
    padding: 25px 50px;
    margin: 200px 0 0 0;
    display: flex;
    justify-content: space-around;
    align-items: center;
    font-size: 1.2rem;
}
`;
var head = document.head;
var style = document.createElement('style');
head.appendChild(style);
style.appendChild(document.createTextNode(css));