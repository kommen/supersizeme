/*!
 *  supersizeme version 0.1
 *  (c) 2009 Dieter Komendera, abloom OG, abloom.at
 *
 *  supersizeme is freely distributable under the terms of an MIT-style license.
 *  inspired by supersized (http://www.buildinternet.com/project/supersized/)
 *----------------------------------------------------------------------------------*/

SupersizeMe = Class.create({
  initialize: function(element, options) {
    this.element = $(element);

    this.options = Object.extend({
      startWidth: 640,
      startHeight: 480,
      verticalCenter: true,
      slideShow: true,
      navigation: true,
      transition: 'crossfade',
      duration: 2,
      slideCounter: true,
      slideCaptions: true,
      slideInterval: 3
    }, options);

    this.animating  = false;
    this.paused = true;
    this.slides = this.element.select('a');

    this.slides.invoke('setOpacity', 0);
    this.registerEvents();
  },

  registerEvents: function() {
    document.observe('dom:loaded', this.onLoad.bind(this));
    Event.observe(window, 'resize', this.resizeNow.bind(this));
  },

  onLoad: function(event) {
    $('loading').fade();
    this.element.show();
    $('content').show();

    if (this.element.select('.activeslide').length == 0) {
      var slide = this.element.down('a').addClassName('activeslide');
      slide.appear({ duration: this.options.duration, after: function() { this.animating = false; }.bind(this) })
    }

    this.resizeNow();

    if (this.options.slideCaptions)
      $('slidecaption').update(this.element.down('.activeslide img').readAttribute('title'));

    if (this.options.navigation)
      this.initNaviation();
    else
      $('navigation').hide();

    if (this.options.slideShow) {
      if (this.options.slideCounter) {
        $('slidecounter').down('.slidenumber').update(1);
        $('slidecounter').down('.totalslides').update(this.slides.length);
      }
      this.play();
    }
  },

  initNaviation: function() {
     $('nextslide').observe('click', function(event) {
       if(!this.animating)
         this.nextSlide();
       return false;
     }.bind(this));

     $('prevslide').observe('click', function(event) {
       if(!this.animating)
         this.previousSlide();
       return false;
     }.bind(this));

     $('pauseplay').observe('click', function(event) {
        this.paused ? this.play() : this.pause();
        return false;
     }.bind(this));
  },

  resizeNow: function() {
    var ratio = this.options.startHeight/this.options.startWidth;
    var currentImage = this.element.down('.activeslide img');
    var viewportWidth = document.viewport.getDimensions().width, viewportHeight = document.viewport.getDimensions().height;

    if ((viewportHeight/viewportWidth) > ratio) {
        this.element.setStyle({ width: viewportHeight / ratio + 'px', height: viewportHeight + 'px'})
        currentImage.height = viewportHeight;
        currentImage.width = viewportWidth / ratio;
    } else {
        this.element.setStyle({ width: viewportWidth + 'px', height: viewportWidth * ratio + 'px'})
        currentImage.height = viewportWidth * ratio;
        currentImage.width = viewportWidth;
    }

    if (this.options.verticalCenter) {
      currentImage.setStyle({
        left: (viewportWidth - this.element.getWidth())  / 2 + 'px',
        top: (viewportHeight - this.element.getHeight()) / 2 + 'px'
      });
    }
    return false;
  },

  play: function() {
    if (!this.paused)
      return false;
    this.slideshowInterval = new PeriodicalExecuter(this.nextSlide.bind(this), this.options.slideInterval);
    this.paused = false;
    $('pauseplay').down('img').src = 'images/pause_dull.gif';
  },

  pause: function() {
    if (this.slideshowInterval)
     this.slideshowInterval.stop();
    this.paused = true;
    $('pauseplay').down('img').src = 'images/play_dull.gif';
  },

  nextSlide: function() {
    this.switchSlide('next');
  },

  previousSlide: function() {
    this.switchSlide('previous');
  },

  switchSlide: function (direction) {
    if (this.animating)
      return false;

    this.animating = true;

    var prevSlide    = this.element.down('a.activeslide').removeClassName('activeslide');
    var currentSlide = prevSlide[direction]()     || this.slides[direction == 'next' ? 'first' : 'last']();
    var nextSlide    = currentSlide[direction]()  || this.slides[direction == 'next' ? 'first' : 'last']();

    if (this.options.slideCounter)
      $('slidecounter').down('.slidenumber').update(this.slides.indexOf(currentSlide) + 1);

    // missing, add/remove class .prevslide

    if (this.options.slideCaptions)
      $('slidecaption').update(currentSlide.down('img').readAttribute('title'));

    currentSlide.addClassName('activeslide');

    SupersizeMe.Transitions[this.options.transition].bind(this)(prevSlide, currentSlide);
    this.resizeNow();
  }
});

SupersizeMe.Transitions = {
  simple: function(prevSlide, currentSlide) {
    prevSlide.hide();
    currentSlide.setOpacity(1).show();
    this.animating = false;
  },
  crossfade: function(prevSlide, currentSlide) {
    prevSlide.fade({ duration: this.options.duration });
    currentSlide.appear({ duration: this.options.duration, after: function() { this.animating = false; }.bind(this) });
  }
}
