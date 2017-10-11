
function AimAid(name,_param = []) {
    outer = this;
    this.name = name;
    this.angle = 0;
    this.radius = 100;
    this.width = 300;
    this.lastUpdate = performance.now();
    _param.forEach(function(e) {
        this[e.name] = e.trans(e.initialSlider);
    }.bind(this));
    this.parameters = _param;
    this.controls = _param.map(e => {
        const div  = document.createElement("div");
        const elem = document.createElement("input");
        const disp = document.createElement("span");
        elem.type = "range";
        elem.value = e.initialSlider;
        elem.addEventListener("change", ev => {
            outer[e.name] = e.trans(elem.value)
            disp.innerHTML = outer[e.name].toLocaleString("en",
                maximumFractionalDigits=3,
                minimumFractionalDigits=3
            );
        });
        [document.createTextNode(e.name),elem,disp].forEach(
            e => div.appendChild(e)
        );
        return div;
    });

    //create canvas
    this.canvas = document.createElement("canvas");
    {
        this.canvas.classList.add("aimaid");
        this.canvas.width = this.width;
        this.canvas.height = this.width
        this.canvas.style.width = this.width + "px";
        this.canvas.style.height = this.width + "px";

        document.addEventListener('mousemove', e => this.update(e.movementX, e.movementY));
        this.canvas.addEventListener('click', function(e) {
            this.canvas.requestPointerLock();
            console.log("request " + this.name);
        });
    }

    //create widget
    this.widget = document.createElement("div");
    {
        const heading = document.createElement("h2");
        heading.innerHTML = this.name;
        this.widget.appendChild(heading);
        this.controls.forEach(c => this.widget.appendChild(c));
        this.widget.appendChild(this.canvas);
    }
}

AimAid.prototype.update = function(mdx,mdy) {
    const now = performance.now();
    const dt = now - this.lastUpdate;
    //update last movement
    this.lastUpdate = now;
    this.updateDT(dt,mdx,mdy);
};

AimAid.prototype.updateDT = function(dT,mdx,mdy) {
    const perpX = -1 * Math.sin(this.angle);
    const perpY = Math.cos(this.angle);
    const dadm = perpX * mdx + perpY * mdy;

    this.angle = this.angle + dadm * 0.01;
};

AimAid.prototype.drawCircle = function(x,y,r, fill = false) {
    //draw center dot
    const ctx = this.canvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(x,y,r, 0, 2*Math.PI, false);
    ctx.stroke();
    if(fill)
        ctx.fill();
    ctx.closePath();
}

AimAid.prototype.draw   = function() {
    const ctx = this.canvas.getContext("2d");
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,this.width,this.width);
    ctx.setTransform(1,0,0,1,this.width/2,this.width/2);
    this.drawCircle(0,0,4,true);
    this.drawCircle(
        this.radius * Math.cos(this.angle), 
        this.radius * Math.sin(this.angle),
        7, true
    );
};


//here come the implementations
const aidDescs = [
    {
        "name": "Normal Projection",
        "params": [{
            "name": "sensitivity",
            "trans": function(x) 0.01 * Math.pow(10,(x - 50) / 25),
            "initialSlider": 50
        }],
        "updateDT": function(dT,mdx,mdy) {
            const perpX = -1 * Math.sin(this.angle);
            const perpY = Math.cos(this.angle);

            const dadm = perpX * mdx + perpY * mdy;

            this.angle = this.angle + dadm * this.sensitivity;
        }
    },
    {
        "name": "Normal Projection with Momentum",
        "params": [
            {   
                "name": "sensitivity",
                "trans": function(x) 0.01 * Math.pow(10,(x - 50) / 25),
                "initialSlider": 50
            },
            {
                "name": "momentum",
                "trans": function(x) 0.01 * Math.pow(10,(x - 50) / 25),
                "initialSlider": 50
            }
        ],
        "updateDT": function(dT,mdx,mdy) {
            const perpX = -1 * Math.sin(this.angle);
            const perpY = Math.cos(this.angle);

            const dadm = perpX * mdx + perpY * mdy;

            this.angle = this.angle + dadm * this.sensitivity;
        }
    }
]

//construct aim aid objects
const aids = aidDescs.map(desc => {
    const aid = new AimAid(desc.name,desc.params);
    aid.updateDT = desc.updateDT;
    return aid;
})

//install aim aids with canvases
aids.forEach(aid => {
    document.getElementById("holder").appendChild(aid.widget);    
})


//the rest is the game loop
function draw(t){
    aids.forEach(a => {
        a.update(0,0);
        a.draw();
    });
    window.requestAnimationFrame(draw);
}

window.requestAnimationFrame(draw);
