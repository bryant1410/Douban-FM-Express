// Generated by CoffeeScript 1.7.1
(function() {
  var API_HOST, AUTH_URL, Application, CHANNELS_URL, PLAYLIST_URL, app_name, fm, version;

  plyr.setup();

  window.player = document.querySelectorAll(".player")[0].plyr;

  $(".player-volume").on("input", function(e) {
    var max, min, val;
    min = e.target.min;
    max = e.target.max;
    val = e.target.value;
    return $(e.target).css({
      "backgroundSize": (val - min) * 100 / (max - min) + "% 100%"
    });
  }).trigger('input');

  API_HOST = "http://www.douban.com";

  CHANNELS_URL = API_HOST + "/j/app/radio/channels";

  AUTH_URL = API_HOST + "/j/app/login";

  PLAYLIST_URL = API_HOST + "/j/app/radio/people";

  app_name = "radio_desktop_win";

  version = 100;

  Application = Application = (function() {
    function Application() {
      this.channel = 1;
      this.user_id = null;
      this.token = null;
      this.expire = null;
      this.email = null;
      this.user_name = null;
      this.sid = null;
      this.history = [];
      this.playlist = [];
      this.song = null;
      player.media.addEventListener('ended', (function(_this) {
        return function() {
          return _this.ended();
        };
      })(this));
      player.media.addEventListener('canplay', (function(_this) {
        return function() {
          console.log("Can Play");
          return _this.hideLoading();
        };
      })(this));
      $(".album img").load(function() {
        return $(this).addClass('show');
      });
      $("img").trigger('load');
    }

    Application.prototype.fetchChannels = function() {
      return $.ajax(CHANNELS_URL);
    };

    Application.prototype.login = function(email, password) {
      var defer, self;
      self = this;
      defer = new Q.defer();
      if (!email || !password) {
        defer.reject({
          err: "Both email and password are needed!"
        });
      } else {
        $.post(AUTH_URL, {
          app_name: app_name,
          version: version,
          email: email,
          password: password
        }).done(function(result) {
          console.log(result);
          if (result.r) {
            return defer.reject(result.err);
          } else {
            self.user_id = result.user_id;
            self.token = result.token;
            self.expire = result.expire;
            self.email = result.email;
            self.user_name = result.user_name;
            return defer.resolve(result);
          }
        });
      }
      return defer.promise;
    };

    Application.prototype.fetchSong = function(type, shouldPlay) {
      var channel, data, defer, self;
      if (type == null) {
        type = "n";
      }
      console.log("Fetching");
      self = this;
      defer = new Q.defer();
      if (type !== "b" && type !== "e" && type !== "n" && type !== "p" && type !== "s" && type !== "r" && type !== "s" && type !== "u") {
        defer.reject({
          err: "Type Error!"
        });
      } else {
        channel = this.channel;
        data = {
          app_name: app_name,
          version: version,
          type: type,
          channel: channel
        };
        if (this.user_id && this.token && this.expire) {
          data.user_id = this.user_id;
          data.token = this.token;
          data.expire = this.expire;
        }
        if (type !== "n") {
          data.sid = this.sid;
        }
        if (type === "p") {
          data.h = this.getHistory();
        }
        $.get(PLAYLIST_URL, data).done(function(result) {
          console.log("Fetched....");
          if (result.r) {
            return defer.reject(result.err);
          } else {
            if (type === 'p') {
              self.clearHistory();
            }
            self.playlist = result.song;
            if (shouldPlay) {
              self.play(result.song[0]);
            }
            return defer.resolve(result.song);
          }
        });
      }
      return defer.promise;
    };

    Application.prototype.addHistory = function(sid, type) {
      return this.history.push("" + sid + ":" + type);
    };

    Application.prototype.getHistory = function() {
      return "|" + this.history.join("|");
    };

    Application.prototype.clearHistory = function() {
      return this.history = [];
    };

    Application.prototype.play = function(song) {
      console.log("play");
      if (!song) {
        return player.play();
      } else {
        this.applyHeart(song);
        player.source(song.url);
        if (this.sid) {
          this.addHistory(this.sid, "e");
        }
        this.sid = song.sid;
        this.song = song;
        player.play();
        return this.setAlbum(song);
      }
    };

    Application.prototype.setAlbum = function(song) {
      var pic;
      pic = song.picture.replace("mpic", 'lpic');
      return $(".album img").attr('src', pic);
    };

    Application.prototype.applyHeart = function(song) {
      var star;
      star = !!song.like;
      return $(".player").toggleClass("like", star);
    };

    Application.prototype.next = function(type) {
      var playedHalf, self;
      this.showLoading();
      self = this;
      $(".player-progress-seek").val(0);
      playedHalf = player.media.duration && player.media.currentTime / player.media.duration > 0.5;
      console.log(player.media.duration);
      if (playedHalf) {
        this.addHistory(this.sid, type);
      }
      if (this.playlist.length) {
        return this.play(this.playlist.pop());
      } else {
        return this.fetchSong(type).then(function() {
          self.clearHistory();
          return self.next();
        }, function(err) {
          return console.log(err);
        });
      }
    };

    Application.prototype.heart = function() {
      return this.fetchSong("r");
    };

    Application.prototype.unheart = function() {
      return this.fetchSong("u");
    };

    Application.prototype.toggleHeart = function() {
      var hasLike, promise;
      hasLike = $("#player").hasClass("like");
      promise = hasLike ? this.unheart() : this.heart();
      return promise.then(function() {
        return $("#player").toggleClass("like", !hasLike);
      });
    };

    Application.prototype.block = function() {
      return this.fetchSong("b", true);
    };

    Application.prototype.skip = function() {
      return this.next();
    };

    Application.prototype.ended = function() {
      return this.next();
    };

    Application.prototype.openLink = function() {
      if (this.song) {
        require('shell').openExternal("http://music.douban.com" + this.song.album);
      }
      return false;
    };

    Application.prototype.switchChannel = function(id) {
      this.channel = id;
      this.playlist = [];
      return this.next();
    };

    Application.prototype.showLoading = function() {
      $(".album .loading").addClass("show");
      return $(".album .img").removeClass("show");
    };

    Application.prototype.hideLoading = function() {
      return $(".album .loading").removeClass("show");
    };

    return Application;

  })();

  fm = new Application();

  fm.next('n');

  $(".album .info").click(function() {
    return fm.openLink();
  });

  $(".album .close").click(function() {
    return window.close();
  });

  $(".album .menu").click(function() {
    var BrowserWindow, mainWindow, remote, width;
    $(".wrapper").toggleClass("open");
    width = $(".wrapper").hasClass("open") ? 650 : 450;
    remote = require('remote');
    BrowserWindow = remote.require('browser-window');
    mainWindow = BrowserWindow.getFocusedWindow();
    return mainWindow.setSize(width, 550);
  });

  $(".controls .icon.play").click(function() {
    return player.play();
  });

  $(".controls .icon.pause").click(function() {
    return player.pause();
  });

  $(".controls .icon.next").click(function() {
    return fm.next();
  });

  $(".controls .icon.heart").click(function() {
    return fm.toggleHeart();
  });

  $(".controls .icon.trash").click(function() {
    return fm.block();
  });

}).call(this);
