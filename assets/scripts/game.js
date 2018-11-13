cc.Class({
    extends: cc.Component,

    properties: {
        paiPrefab: {
            default: null,
            type: cc.Prefab
        },

        spriteFrames: {
            default: [],
            type: [cc.SpriteFrame]
        },

        tutorial: {
            default: null,
            type: cc.Node
        },

        startButton: {
            default: null,
            type: cc.Button
        },
        _paiSprites: {
            default: [],
            type: [cc.Node]
        },

        _pais: null,

        rows: 8,
        columns: 17,

        paiWidth: 60,
        paiHeight: 90,

        paddingLeft: 640,
        paddingTop: 360,

        _lastPai: null,
        lastX: 0,
        lastY: 0,

        moveDirection: -1,
        moveStart: 0,
        moveEnd: 0,
        moveMin: 0,
        moveMax: 0,
        originalX: 0,
        originalY: 0,

        mouseDown: false,
        count: 0,

        coward: false
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this)
    },

    onKeyDown (event) {
        switch(event.keyCode) {
            case cc.macro.KEY.n:
                if (this.coward && this._lastPai != null && this._lastPai.getComponent('Pai').type != -1) {
                    for (var i = 0; i < 4; i++) {
                        var index = this._pais[this._lastPai.getComponent('Pai').type  * 4 + i]
                        if (index != null) {
                            this._paiSprites[index.x][index.y].color = cc.Color.WHITE
                        }
                    }
                }
                this.coward = !this.coward
                break
        }
    },

    onDestroy () {
        var pais = ""
        for (var i = 0; i < this.rows; i++) {
            for (var j = 0; j < this.columns; j++) {
                pais += this._paiSprites[i][j].getComponent('Pai').type + " "
            }
        }
        cc.sys.localStorage.setItem('pais', pais)
        cc.log('save state')
    },

    onGameStart () {
        this._pais = new Array(this.rows * this.columns)
        this._paiSprites = new Array(this.rows)
        for (var i = 0; i < this.rows; i++) {
            this._paiSprites[i] = new Array(this.columns)
            for (var j = 0; j < this.columns; j++) {
                this._paiSprites[i][j] = null
            }
        }

        var self = this
        for (var i = 0; i < this.rows; i++) {
            for (var j = 0; j < this.columns; j++) {
                var newNode = cc.instantiate(this.paiPrefab)
                newNode.getComponent(cc.Sprite).spriteFrame = this.spriteFrames[Math.trunc((i * this.rows + j) / 4)]
                this._paiSprites[i][j] = newNode
                this.node.addChild(newNode)
                newNode.setPosition(cc.v2(this.paiWidth * j - this.paddingLeft, this.paiHeight * i - this.paddingTop))
            }
        }
        this.node.on(cc.Node.EventType.TOUCH_END, function(event) {
            this.onTouchEnd(event, self)
        }, this)
        this.node.on(cc.Node.EventType.TOUCH_START, function(event) {
            this.onTouchStart(event, self)
        }, this)
        this.node.on(cc.Node.EventType.TOUCH_MOVE, function(event) {
            this.onTouchMove(event, self)
        }, this)

        var paisStorage = cc.sys.localStorage.getItem('pais')
        if (paisStorage != null) {
            var pais = paisStorage.split(' ')
            for (var i = 0; i < this.rows; i++) {
                for (var j = 0; j < this.columns; j++) {
                    this._paiSprites[i][j].getComponent(cc.Sprite).spriteFrame = this.spriteFrames[pais[i * columns + j] == -1 ? 34 : pais[i * columns + j]]
                    this._paiSprites[i][j].getComponent('Pai').type = pais[i * columns + j]
                }
            }
        } else {
            this.shuffle()
        }
        this.tutorial.active = false
        this.startButton.active = false
        this.startButton.enabled = false
        this.startButton.visable = false
    },

    onTouchStart (event, self) {
        if (self.mouseDown === true && self._lastPai != null) {
            var row = self._lastPai.getComponent('Pai').x
            var column = self._lastPai.getComponent('Pai').y
            if (self.moveDirection === 0) {
                for (var j = self.moveStart; j <= self.moveEnd; j++) {
                    self._paiSprites[row][j].x = self._paiSprites[row][j].getComponent('Pai').y * self.paiWidth - self.paddingLeft
                    self._paiSprites[row][j].zIndex = 0
                }
            } else if (self.moveDirection === 1) {
                for (var i = self.moveStart; i <= self.moveEnd; i++) {
                    self._paiSprites[i][column].y = self._paiSprites[i][column].getComponent('Pai').x * self.paiHeight - self.paddingTop
                    self._paiSprites[i][column].zIndex = 0
                }
            }
        }
        self.mouseDown = true
        var currentPai = self._paiSprites[Math.floor(event.getLocationY() / this.paiHeight)][Math.floor(event.getLocationX() / this.paiWidth)]
        if (self._lastPai != null) {
            self._lastPai.color = cc.Color.WHITE
            if (self.coward && self._lastPai.getComponent('Pai').type != -1) {
                for (var i = 0; i < 4; i++) {
                    var index = self._pais[self._lastPai.getComponent('Pai').type  * 4 + i]
                    if (index != null) {
                        self._paiSprites[index.x][index.y].color = cc.Color.WHITE
                    }
                }
            }
            if (currentPai.getComponent('Pai').type === self._lastPai.getComponent('Pai').type && self._lastPai.getComponent('Pai').type != -1 && currentPai != self._lastPai) {
                var currentX = currentPai.getComponent('Pai').x
                var currentY = currentPai.getComponent('Pai').y
                var lastX = self._lastPai.getComponent('Pai').x
                var lastY = self._lastPai.getComponent('Pai').y

                cc.log("current: " + currentX + "," + currentY)
                cc.log("last: " + lastX + "," + lastY)
                var match = true
                var lowX = Math.min(currentX, lastX)
                var lowY = Math.min(currentY, lastY)
                var highX = Math.max(currentX, lastX)
                var highY = Math.max(currentY, lastY)

                if ((currentX < lastX && currentY < lastY) || (currentX >= lastX && currentY >= lastY)) {
                    cc.log("a")
                    for (var i = lowX + 1; i <= highX; i++) {
                        cc.log("a1: " + i + "," + lowY + ":" + self._paiSprites[i][lowY].getComponent('Pai').type)
                        if (i != highX && self._paiSprites[i][lowY].getComponent('Pai').type != -1) {
                            match = false
                            break
                        }
                    }

                    if (match) {
                        for (var j = lowY; j < highY; j++) {
                            cc.log("a2: " + highX + "," + j + ":" + self._paiSprites[highX][j].getComponent('Pai').type)
                            if (self._paiSprites[highX][j].getComponent('Pai').type != -1) {
                                match = false
                                break
                            }
                        }
                    }

                    if (!match) {
                        match = true
                        for (var j = lowY + 1; j <= highY; j++) {
                            cc.log("a3: " + lowX + "," + j + ":" + self._paiSprites[lowX][j].getComponent('Pai').type)
                            if (j != highY && self._paiSprites[lowX][j].getComponent('Pai').type != -1) {
                                match = false
                                break
                            }
                        }

                        if (match) {
                            for (var i = lowX; i < highX; i++) {
                                cc.log("a4: " + i + "," + highY + ":" + self._paiSprites[i][highY].getComponent('Pai').type)
                                if (self._paiSprites[i][highY].getComponent('Pai').type != -1) {
                                    match = false
                                    break
                                }
                            }
                        }
                    }
                } else if ((currentX >= lastX && currentY < lastY) || (currentX < lastX && currentY >= lastY)) {
                    cc.log("b")
                    for (var i = lowX + 1; i <= highX; i++) {
                        cc.log("b1: " + i + "," + highY + ":" + self._paiSprites[i][highY].getComponent('Pai').type)
                        if (i != highX && self._paiSprites[i][highY].getComponent('Pai').type != -1) {
                            match = false
                            break
                        }
                    }

                    if (match) {
                        for (var j = highY; j > lowY; j--) {
                            cc.log("b2: " + highX + "," + j + ":" + self._paiSprites[highX][j].getComponent('Pai').type)
                            if (self._paiSprites[highX][j].getComponent('Pai').type != -1) {
                                match = false
                                break
                            }
                        }
                    }

                    if (!match) {
                        match = true
                        for (var j = highY - 1; j >= lowY; j--) {
                            cc.log("b3: " + lowX + "," + j + ":" + self._paiSprites[lowX][j].getComponent('Pai').type)
                            if (j != lowY && self._paiSprites[lowX][j].getComponent('Pai').type != -1) {
                                match = false
                                break
                            }
                        }

                        if (match) {
                            for (var i = lowX; i < highX; i++) {
                                cc.log("b4: " + i + "," + lowY + ":" + self._paiSprites[i][lowY].getComponent('Pai').type)
                                if (self._paiSprites[i][lowY].getComponent('Pai').type != -1) {
                                    match = false
                                    break
                                }
                            }
                        }
                    }
                }
                if (match) {
                    currentPai.getComponent(cc.Sprite).spriteFrame = self.spriteFrames[34]
                    currentPai.width = this.paiWidth
                    currentPai.height = this.paiHeight
                    self._lastPai.getComponent(cc.Sprite).spriteFrame = self.spriteFrames[34]
                    self._lastPai.width = this.paiWidth
                    self._lastPai.height = this.paiHeight
                    currentPai.getComponent('Pai').type = -1
                    self._lastPai.getComponent('Pai').type = -1
                    self._pais[self._lastPai.index] = null
                    self._pais[currentPai.index] = null
                    currentPai.color = cc.Color.WHITE
                    self.count += 2
                    if (self.count >= self.rows * self.columns) {
                        for (var i = 0; i < this.rows; i++) {
                            for (var j = 0; j < this.columns; j++) {
                                self._paiSprites[i][j].getComponent(cc.Sprite).spriteFrame = this.spriteFrames[Math.trunc(Math.random() * 35)]
                                self._paiSprites[i][j].runAction(self.winSplash())
                            }
                        }
                    }
                }
            }
        }
        currentPai.color = cc.Color.GRAY
        self._lastPai = currentPai
        if (self.coward && currentPai.getComponent('Pai').type != -1) {
            for (var i = 0; i < 4; i++) {
                var index = self._pais[currentPai.getComponent('Pai').type * 4 + i]
                if (index != null && self._paiSprites[index.x][index.y].getComponent('Pai').type != -1) {
                    self._paiSprites[index.x][index.y].color = cc.Color.GRAY
                }
            }
        }
        self.originalX = currentPai.getComponent('Pai').x
        self.originalY = currentPai.getComponent('Pai').y
    },

    onTouchMove (event, self) {
        var delta = event.getDelta()
        var location = event.getLocation()
        if (self._lastPai != null && self._lastPai.getComponent('Pai').type != -1) {
            var x = self._lastPai.getComponent('Pai').x
            var y = self._lastPai.getComponent('Pai').y
            if (self.moveDirection === -1) {
                if (Math.abs(delta.x) > Math.abs(delta.y)) {
                    self.moveDirection = 0
                    if (y === 0) {
                        self.moveStart = 0
                        self.moveMin = 0
                    } else {
                        var i = y - 1
                        while (i >= 0 && self._paiSprites[x][i].getComponent('Pai').type != -1) {
                            i--
                        }
                        self.moveStart = i + 1
                        while (i >= 0 && self._paiSprites[x][i].getComponent('Pai').type === -1) {
                            i--
                        }
                        self.moveMin = i + 1
                    }
                    if (y === self.columns - 1) {
                        self.moveEnd = self.columns - 1
                        self.moveMax = self.columns - 1
                    } else {
                        var i = y + 1
                        while (i < self.columns && self._paiSprites[x][i].getComponent('Pai').type != -1) {
                            i++
                        }
                        self.moveEnd = i - 1
                        while (i < self.columns && self._paiSprites[x][i].getComponent('Pai').type === -1) {
                            i++
                        }
                        self.moveMax = i - 1
                    }
                    for (var j = self.moveStart; j <= self.moveEnd; j++) {
                        self._paiSprites[x][j].zIndex = 1000
                    }
                } else {
                    self.moveDirection = 1
                    if (x === 0) {
                        self.moveStart = 0
                        self.moveMin = 0
                    } else {
                        var i = x - 1
                        while (i >= 0 && self._paiSprites[i][y].getComponent('Pai').type != -1) {
                            i--
                        }
                        self.moveStart = i + 1
                        while (i >= 0 && self._paiSprites[i][y].getComponent('Pai').type === -1) {
                            i--
                        }
                        self.moveMin = i + 1
                    }
                    if (x === self.rows - 1) {
                        self.moveEnd = self.rows - 1
                    } else {
                        var i = x + 1
                        while (i < self.rows && self._paiSprites[i][y].getComponent('Pai').type != -1) {
                            i++
                        }
                        self.moveEnd = i - 1
                        while (i < self.rows && self._paiSprites[i][y].getComponent('Pai').type === -1) {
                            i++
                        }
                        self.moveMax = i - 1
                    }
                    for (var i = self.moveStart; i <= self.moveEnd; i++) {
                        self._paiSprites[i][y].zIndex = 1000
                    }
                }
            }

            if (self.moveDirection === 0) {
                var row = self._lastPai.getComponent('Pai').x
                if ((delta.x > 0 && self._paiSprites[row][self.moveEnd].x + delta.x <= self.moveMax * self.paiWidth - self.paddingLeft)
                    || (delta.x < 0 && self._paiSprites[row][self.moveStart].x + delta.x >= self.moveMin * self.paiWidth - self.paddingLeft)) {
                    for (var j = self.moveStart; j <= self.moveEnd; j++) {
                        self._paiSprites[row][j].x += delta.x
                        self._paiSprites[row][j].zIndex = 1000
                    }
                }
            } else {
                var column = self._lastPai.getComponent('Pai').y
                if ((delta.y > 0 && self._paiSprites[self.moveEnd][column].y + delta.y <= self.moveMax * self.paiHeight - self.paddingTop)
                    || (delta.y < 0 && self._paiSprites[self.moveStart][column].y + delta.y >= self.moveMin * self.paiHeight - self.paddingTop)) {
                    for (var i = self.moveStart; i <= self.moveEnd; i++) {
                        self._paiSprites[i][column].y += delta.y
                        self._paiSprites[i][column].zIndex = 1000
                    }
                }
            }
        }
    },

    onTouchEnd (event, self) {
        cc.log('touchEnd: ')
        self.mouseDown = false
        if (self.moveDirection === 0) {
            var row = self._lastPai.getComponent('Pai').x
            var column = self._lastPai.getComponent('Pai').y
            var currentX = Math.round((self._lastPai.x + this.paddingLeft) / self.paiWidth)
            var delta = currentX - column
            var matchFound = false
            // cc.log('column: ' + column)
            // cc.log('currentX: ' + currentX)
            // cc.log('delta: '  + delta)
            if (delta > 0) {
                for (var j = self.moveStart; j <= self.moveEnd + delta; j++) {
                    if (j < self.moveStart + delta && row != self.rows - 1 && row != 0) {
                        var highX = row + 1
                        while (highX < self.rows && self._paiSprites[highX][j].getComponent('Pai').type === -1) {
                            highX++
                        }
                        var lowX = row - 1
                        while (lowX >= 0 && self._paiSprites[lowX][j].getComponent('Pai').type === -1) {
                            lowX--
                        }
                        //cc.log('lowX: ' + lowX)
                        //cc.log('highX: ' + highX + ", j: " + j + ", type: " + self._paiSprites[highX][j].getComponent('Pai').type)
                        //cc.log('lowX: ' + lowX + ", j: " + j + ", type: " + self._paiSprites[lowX][j].getComponent('Pai').type)
                        if (lowX >= 0 && highX < self.rows && self._paiSprites[highX][j].getComponent('Pai').type === self._paiSprites[lowX][j].getComponent('Pai').type
                            && self._paiSprites[lowX][j].getComponent('Pai').type != -1) {
                            matchFound = true
                            break
                        }
                    }
                    if (j >= self.moveStart + delta) {
                        if (row != self.rows - 1) {
                            var highX = row + 1
                            while (highX < self.rows && self._paiSprites[highX][j].getComponent('Pai').type === -1) {
                                highX++
                            }
                            //cc.log('highX: ' + highX + ", j: " + "" + j + ", type: " + self._paiSprites[highX][j].getComponent('Pai').type)
                            //cc.log('row: ' + row + ", j: " + j + ", delta" + delta + ", type: " + self._paiSprites[row][j - delta].getComponent('Pai').type)
                            if (highX < self.rows && self._paiSprites[highX][j].getComponent('Pai').type == self._paiSprites[row][j - delta].getComponent('Pai').type
                                && self._paiSprites[highX][j].getComponent('Pai').type != -1) {
                                    matchFound = true
                                    break
                            }
                        }
                        if (row != 0) {
                            var lowX = row - 1
                            while (lowX >= 0 && self._paiSprites[lowX][j].getComponent('Pai').type === -1) {
                                lowX--
                            }
                            //cc.log('lowX: ' + lowX + ", j: " + "" + j)
                            //cc.log('lowX: ' + lowX + ", j: " + "" + j + ", type: " + self._paiSprites[lowX][j].getComponent('Pai').type)
                            //cc.log('row: ' + row + ", j: " + j + ", delta" + delta + ", type: " + self._paiSprites[row][j - delta].getComponent('Pai').type)
                            if (lowX >= 0 && self._paiSprites[lowX][j].getComponent('Pai').type === self._paiSprites[row][j - delta].getComponent('Pai').type
                                && self._paiSprites[lowX][j].getComponent('Pai').type != -1) {
                                matchFound = true
                                break
                            }
                        }
                    }
                }
                cc.log("matchFound: " + matchFound)
                if (matchFound) {
                    for (var j = self.moveEnd; j >= self.moveStart; j--) {
                        //cc.log("x: " + row + ", y: " + (j + delta) + ", from: " + self._paiSprites[row][j + delta].getComponent('Pai').type + ", to: " + self._paiSprites[row][j].getComponent('Pai').type)
                        var type = self._paiSprites[row][j].getComponent('Pai').type
                        self._paiSprites[row][j + delta].getComponent('Pai').type = type
                        self._paiSprites[row][j + delta].getComponent(cc.Sprite).spriteFrame = self.spriteFrames[type]
                        self._paiSprites[row][j + delta].index = self._paiSprites[row][j].index
                        self._paiSprites[row][j + delta].width = self.paiWidth
                        self._paiSprites[row][j + delta].height = self.paiHeight
                        self._pais[self._paiSprites[row][j].index] = cc.v2(row, j + delta)
                        if (j < self.moveStart + delta) {
                            self._paiSprites[row][j].getComponent('Pai').type = -1
                            self._paiSprites[row][j].getComponent(cc.Sprite).spriteFrame = self.spriteFrames[34]
                        }
                        //cc.log('set row: ' + row + ', j: ' + j + " to " + self._paiSprites[row][j].getComponent('Pai').x)
                        self._paiSprites[row][j].x = self._paiSprites[row][j].getComponent('Pai').y * self.paiWidth - self.paddingLeft
                        self._paiSprites[row][j].zIndex = 0
                        self._paiSprites[row][j].width = self.paiWidth
                        self._paiSprites[row][j].height = self.paiHeight
                    }
                    self._lastPai.color = cc.Color.WHITE
                    self._lastPai = self._paiSprites[row][currentX]
                    self._lastPai.color = cc.Color.GRAY
                    if (self.coward) {
                        for (var i = 0; i < 4; i++) {
                            var index = self._pais[self._lastPai.getComponent('Pai').type * 4 + i]
                            if (index != null) {
                                self._paiSprites[index.x][index.y].color = cc.Color.GRAY
                            }
                        }
                    }
                } else {
                    for (var j = self.moveStart; j <= self.moveEnd; j++) {
                        self._paiSprites[row][j].x = self._paiSprites[row][j].getComponent('Pai').y * self.paiWidth - self.paddingLeft
                        self._paiSprites[row][j].zIndex = 0
                    }
                }
            } else if (delta < 0) {
                for (var j = self.moveStart + delta; j <= self.moveEnd; j++) {
                    if (j > self.moveEnd + delta && row != self.rows - 1 && row != 0) {
                        var highX = row + 1
                        while (highX < self.rows && self._paiSprites[highX][j].getComponent('Pai').type === -1) {
                            highX++
                        }
                        var lowX = row - 1
                        while (lowX >= 0 && self._paiSprites[lowX][j].getComponent('Pai').type === -1) {
                            lowX--
                        }
                        //cc.log('lowX: ' + lowX)
                        //cc.log('highX: ' + highX + ", j: " + j + ", type: " + self._paiSprites[highX][j].getComponent('Pai').type)
                        //cc.log('lowX: ' + lowX + ", j: " + j + ", type: " + self._paiSprites[lowX][j].getComponent('Pai').type)
                        if (highX < self.rows && lowX >= 0 && self._paiSprites[highX][j].getComponent('Pai').type === self._paiSprites[lowX][j].getComponent('Pai').type
                            && self._paiSprites[lowX][j].getComponent('Pai').type != -1) {
                            matchFound = true
                            break
                        }
                    }
                    if (j <= self.moveEnd + delta) {
                        if (row != self.rows - 1) {
                            var highX = row + 1
                            while (highX < self.rows && self._paiSprites[highX][j].getComponent('Pai').type === -1) {
                                highX++
                            }
                            //cc.log('highX: ' + highX + ", j: " + "" + j + ", type: " + self._paiSprites[highX][j].getComponent('Pai').type)
                            //cc.log('row: ' + row + ", j: " + j + ", delta" + delta + ", type: " + self._paiSprites[row][j - delta].getComponent('Pai').type)
                            if (highX < self.rows && self._paiSprites[highX][j].getComponent('Pai').type == self._paiSprites[row][j - delta].getComponent('Pai').type
                                && self._paiSprites[highX][j].getComponent('Pai').type != -1) {
                                    matchFound = true
                                    break
                            }
                        }
                        if (row != 0) {
                            var lowX = row - 1
                            while (lowX >= 0 && self._paiSprites[lowX][j].getComponent('Pai').type === -1) {
                                lowX--
                            }
                            //cc.log('lowX: ' + lowX + ", j: " + "" + j)
                            //cc.log('lowX: ' + lowX + ", j: " + "" + j + ", type: " + self._paiSprites[lowX][j].getComponent('Pai').type)
                            //cc.log('row: ' + row + ", j: " + j + ", delta" + delta + ", type: " + self._paiSprites[row][j - delta].getComponent('Pai').type)
                            if (lowX >= 0 && self._paiSprites[lowX][j].getComponent('Pai').type === self._paiSprites[row][j - delta].getComponent('Pai').type
                                && self._paiSprites[lowX][j].getComponent('Pai').type != -1) {
                                matchFound = true
                                break
                            }
                        }
                    }
                }
                cc.log("matchFound: " + matchFound)
                if (matchFound) {
                    for (var j = self.moveStart; j <= self.moveEnd; j++) {
                        //cc.log("x: " + row + ", y: " + (j + delta) + ", from: " + self._paiSprites[row][j + delta].getComponent('Pai').type + ", to: " + self._paiSprites[row][j].getComponent('Pai').type)
                        var type = self._paiSprites[row][j].getComponent('Pai').type
                        self._paiSprites[row][j + delta].getComponent('Pai').type = type
                        self._paiSprites[row][j + delta].getComponent(cc.Sprite).spriteFrame = self.spriteFrames[type]
                        self._paiSprites[row][j + delta].index = self._paiSprites[row][j].index
                        self._paiSprites[row][j + delta].width = self.paiWidth
                        self._paiSprites[row][j + delta].height = self.paiHeight
                        self._pais[self._paiSprites[row][j].index] = cc.v2(row, j + delta)
                        if (j > self.moveEnd + delta) {
                            self._paiSprites[row][j].getComponent('Pai').type = -1
                            self._paiSprites[row][j].getComponent(cc.Sprite).spriteFrame = self.spriteFrames[34]
                        }
                        //cc.log('set row: ' + row + ', j: ' + j + " to " + self._paiSprites[row][j].getComponent('Pai').x)
                        self._paiSprites[row][j].x = self._paiSprites[row][j].getComponent('Pai').y * self.paiWidth - self.paddingLeft
                        self._paiSprites[row][j].zIndex = 0
                        self._paiSprites[row][j].width = self.paiWidth
                        self._paiSprites[row][j].height = self.paiHeight
                    }
                    self._lastPai.color = cc.Color.WHITE
                    self._lastPai = self._paiSprites[row][currentX]
                    self._lastPai.color = cc.Color.GRAY
                    if (self.coward) {
                        for (var i = 0; i < 4; i++) {
                            var index = self._pais[self._lastPai.getComponent('Pai').type * 4 + i]
                            if (index != null) {
                                self._paiSprites[index.x][index.y].color = cc.Color.GRAY
                            }
                        }
                    }
                } else {
                    for (var j = self.moveStart; j <= self.moveEnd; j++) {
                        self._paiSprites[row][j].x = self._paiSprites[row][j].getComponent('Pai').y * self.paiWidth - self.paddingLeft
                        self._paiSprites[row][j].zIndex = 0
                    }
                }
            } else {
                for (var j = self.moveStart; j <= self.moveEnd; j++) {
                    self._paiSprites[row][j].x = self._paiSprites[row][j].getComponent('Pai').y * self.paiWidth - self.paddingLeft
                    self._paiSprites[row][j].zIndex = 0
                }
            }
        } else if (self.moveDirection === 1) {
            var row = self._lastPai.getComponent('Pai').x
            var column = self._lastPai.getComponent('Pai').y
            var currentY = Math.round((self._lastPai.y + self.paddingTop) / self.paiHeight)
            var delta = currentY - row
            var matchFound = false
            cc.log('row: ' + row)
            cc.log('currentY: ' + currentY)
            cc.log('delta: '  + delta)
            if (delta > 0) {
                for (var i = self.moveStart; i <= self.moveEnd + delta; i++) {
                    if (i < self.moveStart + delta && column != self.columns - 1 && column != 0) {
                        var highY = column + 1
                        while (highY < self.columns && self._paiSprites[i][highY].getComponent('Pai').type === -1) {
                            highY++
                        }
                        var lowY = column - 1
                        while (lowY >= 0 && self._paiSprites[i][lowY].getComponent('Pai').type === -1) {
                            lowY--
                        }
                        //cc.log('lowY: ' + lowY)
                        //cc.log('highX: ' + highX + ", j: " + j + ", type: " + self._paiSprites[highX][j].getComponent('Pai').type)
                        //cc.log('lowX: ' + lowX + ", j: " + j + ", type: " + self._paiSprites[lowX][j].getComponent('Pai').type)
                        if (lowY >= 0 && highY < self.columns && self._paiSprites[i][highY].getComponent('Pai').type === self._paiSprites[i][lowY].getComponent('Pai').type
                            && self._paiSprites[i][lowY].getComponent('Pai').type != -1) {
                            matchFound = true
                            break
                        }
                    }
                    if (i >= self.moveStart + delta) {
                        if (column != self.columns - 1) {
                            var highY = column + 1
                            while (highY < self.columns && self._paiSprites[i][highY].getComponent('Pai').type === -1) {
                                highY++
                            }
                            //cc.log('highY: ' + highY + ", j: " + "" + j + ", type: " + self._paiSprites[highX][j].getComponent('Pai').type)
                            //cc.log('row: ' + row + ", j: " + j + ", delta" + delta + ", type: " + self._paiSprites[row][j - delta].getComponent('Pai').type)
                            if (highY < self.columns && self._paiSprites[i][highY].getComponent('Pai').type == self._paiSprites[i - delta][column].getComponent('Pai').type
                                && self._paiSprites[i][highY].getComponent('Pai').type != -1) {
                                    matchFound = true
                                    break
                            }
                        }
                        if (column != 0) {
                            var lowY = column - 1
                            while (lowY >= 0 && self._paiSprites[i][lowY].getComponent('Pai').type === -1) {
                                lowY--
                            }
                            //cc.log('lowY: ' + lowY)
                            //cc.log('lowX: ' + lowX + ", j: " + "" + j + ", type: " + self._paiSprites[lowX][j].getComponent('Pai').type)
                            //cc.log('row: ' + row + ", j: " + j + ", delta" + delta + ", type: " + self._paiSprites[row][j - delta].getComponent('Pai').type)
                            if (lowY >= 0 && self._paiSprites[i][lowY].getComponent('Pai').type === self._paiSprites[i - delta][column].getComponent('Pai').type
                                && self._paiSprites[i][lowY].getComponent('Pai').type != -1) {
                                matchFound = true
                                break
                            }
                        }
                    }
                }
                cc.log("matchFound: " + matchFound)
                if (matchFound) {
                    for (var i = self.moveEnd; i >= self.moveStart; i--) {
                        //cc.log("x: " + i + ", y: " + (j + delta) + ", from: " + self._paiSprites[row][j + delta].getComponent('Pai').type + ", to: " + self._paiSprites[row][j].getComponent('Pai').type)
                        var type = self._paiSprites[i][column].getComponent('Pai').type
                        self._paiSprites[i + delta][column].getComponent('Pai').type = type
                        self._paiSprites[i + delta][column].getComponent(cc.Sprite).spriteFrame = self.spriteFrames[type]
                        self._paiSprites[i + delta][column].index = self._paiSprites[i][column].index
                        self._paiSprites[i + delta][column].width = self.paiWidth
                        self._paiSprites[i + delta][column].height = self.paiHeight
                        self._pais[self._paiSprites[i][column].index] = cc.v2(i + delta, column)
                        if (i < self.moveStart + delta) {
                            self._paiSprites[i][column].getComponent('Pai').type = -1
                            self._paiSprites[i][column].getComponent(cc.Sprite).spriteFrame = self.spriteFrames[34]
                        }
                        //cc.log('set row: ' + row + ', j: ' + j + " to " + self._paiSprites[row][j].getComponent('Pai').x)
                        self._paiSprites[i][column].y = self._paiSprites[i][column].getComponent('Pai').x * self.paiHeight - self.paddingTop
                        self._paiSprites[i][column].zIndex = 0
                        self._paiSprites[i][column].width = self.paiWidth
                        self._paiSprites[i][column].height = self.paiHeight
                    }
                    self._lastPai.color = cc.Color.WHITE
                    self._lastPai = self._paiSprites[currentY][column]
                    self._lastPai.color = cc.Color.GRAY
                    if (self.coward) {
                        for (var i = 0; i < 4; i++) {
                            var index = self._pais[self._lastPai.getComponent('Pai').type * 4 + i]
                            if (index != null) {
                                self._paiSprites[index.x][index.y].color = cc.Color.GRAY
                            }
                        }
                    }
                } else {
                    for (var i = self.moveStart; i <= self.moveEnd; i++) {
                        self._paiSprites[i][column].y = self._paiSprites[i][column].getComponent('Pai').x * self.paiHeight - self.paddingTop
                        self._paiSprites[i][column].zIndex = 0
                    }
                }
            } else if (delta < 0) {
                for (var i = self.moveStart + delta; i <= self.moveEnd; i++) {
                    if (i > self.moveEnd + delta && column != self.columns - 1 && column != 0) {
                        var highY = column + 1
                        while (highY < self.columns && self._paiSprites[i][highY].getComponent('Pai').type === -1) {
                            highY++
                        }
                        var lowY = column - 1
                        while (lowY >= 0 && self._paiSprites[i][lowY].getComponent('Pai').type === -1) {
                            lowY--
                        }
                        cc.log('i: ' + i + ", highY: " + highY)
                        if (highY < self.columns) {
                            cc.log(self._paiSprites[i][highY].getComponent('Pai').type)
                        }
                        cc.log('i: ' + i + ", lowY: " + lowY)
                        if (lowY >= 0) {
                            cc.log(self._paiSprites[i][lowY].getComponent('Pai').type)
                        }
                        //cc.log('highX: ' + highX + ", j: " + j + ", type: " + self._paiSprites[highX][j].getComponent('Pai').type)
                        //cc.log('lowX: ' + lowX + ", j: " + j + ", type: " + self._paiSprites[lowX][j].getComponent('Pai').type)
                        if (highY < self.columns && lowY >= 0 && self._paiSprites[i][highY].getComponent('Pai').type === self._paiSprites[i][lowY].getComponent('Pai').type
                            && self._paiSprites[i][lowY].getComponent('Pai').type != -1) {
                            matchFound = true
                            break
                        }
                    }
                    if (i <= self.moveEnd + delta) {
                        if (column != self.columns - 1) {
                            var highY = column + 1
                            while (highY < self.columns && self._paiSprites[i][highY].getComponent('Pai').type === -1) {
                                highY++
                            }
                            cc.log('i: ' + i + ", highY: " + highY + ", type: " + highY < self.columns ? self._paiSprites[i][highY].getComponent('Pai').type : -1)
                            cc.log('i: ' + i + ", column: " + column + ", delta" + delta + ", type: " + self._paiSprites[i - delta][column].getComponent('Pai').type)
                            if (highY < self.columns && self._paiSprites[i][highY].getComponent('Pai').type == self._paiSprites[i - delta][column].getComponent('Pai').type
                                && self._paiSprites[i][highY].getComponent('Pai').type != -1) {
                                    matchFound = true
                                    break
                            }
                        }
                        if (column != 0) {
                            var lowY = column - 1
                            while (lowY >= 0 && self._paiSprites[i][lowY].getComponent('Pai').type === -1) {
                                lowY--
                            }
                            cc.log('i: ' + i + ", lowY: " + lowY + ", type: " + lowY >= 0 ? self._paiSprites[i][lowY].getComponent('Pai').type : -1)
                            cc.log('i: ' + i + ", column: " + column + ", delta" + delta + ", type: " + self._paiSprites[i - delta][column].getComponent('Pai').type)
                            if (lowY >= 0 && self._paiSprites[i][lowY].getComponent('Pai').type === self._paiSprites[i - delta][column].getComponent('Pai').type
                                && self._paiSprites[i][lowY].getComponent('Pai').type != -1) {
                                matchFound = true
                                break
                            }
                        }
                    }
                }
                cc.log("matchFound: " + matchFound)
                if (matchFound) {
                    for (var i = self.moveStart; i <= self.moveEnd; i++) {
                        //cc.log("x: " + row + ", y: " + (j + delta) + ", from: " + self._paiSprites[row][j + delta].getComponent('Pai').type + ", to: " + self._paiSprites[row][j].getComponent('Pai').type)
                        var type = self._paiSprites[i][column].getComponent('Pai').type
                        self._paiSprites[i + delta][column].getComponent('Pai').type = type
                        self._paiSprites[i + delta][column].getComponent(cc.Sprite).spriteFrame = self.spriteFrames[type]
                        self._paiSprites[i + delta][column].index = self._paiSprites[i][column].index
                        self._paiSprites[i + delta][column].width = self.paiWidth
                        self._paiSprites[i + delta][column].height = self.paiHeight
                        self._pais[self._paiSprites[i][column].index] = cc.v2(i + delta, column)
                        if (i > self.moveEnd + delta) {
                            self._paiSprites[i][column].getComponent('Pai').type = -1
                            self._paiSprites[i][column].getComponent(cc.Sprite).spriteFrame = self.spriteFrames[34]
                        }
                        //cc.log('set row: ' + row + ', j: ' + j + " to " + self._paiSprites[row][j].getComponent('Pai').x)
                        self._paiSprites[i][column].y = self._paiSprites[i][column].getComponent('Pai').x * self.paiHeight - self.paddingTop
                        self._paiSprites[i][column].zIndex = 0
                        self._paiSprites[i][column].width = self.paiWidth
                        self._paiSprites[i][column].height = self.paiHeight
                    }
                    self._lastPai.color = cc.Color.WHITE
                    self._lastPai = self._paiSprites[currentY][column]
                    self._lastPai.color = cc.Color.GRAY
                    if (self.coward) {
                        for (var i = 0; i < 4; i++) {
                            var index = self._pais[self._lastPai.getComponent('Pai').type * 4 + i]
                            if (index != null) {
                                self._paiSprites[index.x][index.y].color = cc.Color.GRAY
                            }
                        }
                    }
                } else {
                    for (var i = self.moveStart; i <= self.moveEnd; i++) {
                        self._paiSprites[i][column].y = self._paiSprites[i][column].getComponent('Pai').x * self.paiHeight - self.paddingTop
                        self._paiSprites[i][column].zIndex = 0
                    }
                }
            } else {
                for (var i = self.moveStart; i <= self.moveEnd; i++) {
                    self._paiSprites[i][column].y = self._paiSprites[i][column].getComponent('Pai').x * self.paiHeight - self.paddingTop
                    self._paiSprites[i][column].zIndex = 0
                }
            }
        }
        self.moveDirection = -1
    },

    shuffle() {
        var array = new Array(this.rows * this.columns)
        var m = array.length, t, index;
        for (var i = 0; i < this.rows * this.columns; i++) {
            array[i] = i
        }

        // While there remain elements to shuffle…
        while (m) {
          // Pick a remaining element…
          index = Math.floor(Math.random() * m--);

          // And swap it with the current element.
          t = array[m];
          array[m] = array[index];
          array[index] = t;
        }

        for (var i = 0; i < this.rows; i++) {
            for (var j = 0; j < this.columns; j++) {
                var index = i * this.columns + j
                var type = Math.trunc(array[index] / 4)
                this._paiSprites[i][j].getComponent(cc.Sprite).spriteFrame = this.spriteFrames[type]
                this._paiSprites[i][j].getComponent('Pai').type = type
                this._paiSprites[i][j].getComponent('Pai').x = i
                this._paiSprites[i][j].getComponent('Pai').y = j
                this._paiSprites[i][j].width = this.paiWidth
                this._paiSprites[i][j].height = this.paiHeight
                this._paiSprites[i][j].index = array[index]
                cc.log(array[index] + ", " + i + ", " + j)
                this._pais[array[index]] = cc.v2(i, j)
            }
        }
    },

    winSplash () {
        var init = cc.moveTo(0, cc.v2(Math.random() * this.paiWidth * this.columns - this.paddingLeft, this.paiHeight * this.rows / 2))
        var start = cc.moveBy(Math.random() / 2, cc.v2(0, -this.paiHeight)).easing(cc.easeCubicActionOut());
        var scaleUp = cc.scaleTo(Math.random() / 2, 0.8, 0.8)
        var move = cc.moveBy(Math.random() * 3, cc.v2(0, -this.paiHeight * (this.rows - 2))).easing(cc.easeCubicActionOut());
        var scaleDown = cc.scaleTo(Math.random() / 2, 0.5, 0.5)
        var end = cc.moveBy(Math.random() / 2, cc.v2(0, -this.paiHeight))
        return cc.repeatForever(cc.sequence(init, start, scaleUp, move, scaleDown, end))
    },

    start () {

    },

    // update (dt) {},
});
