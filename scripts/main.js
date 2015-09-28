window.$http = null;
window.$leftFrame = null;
window.$leftHtml = null;
window.$rightFrame = null;
window.$rightHtml = null;
// window.Book = function(options) {

// };

$(document).on('touchmove', function(e){
  e.preventDefault();
});

(function(){
  if(window.XMLHttpRequest) {
    $http = new XMLHttpRequest();
  } 
  if (!$http) {
    alert('Cannot create an XMLHTTP instance');
    return false;
  }
})();

// This method is used for get XML and it will send parsed XML data to callback function.
function getXMLData(resourcePath, callback) {
  $http.onreadystatechange = function(){
    if($http.readyState === 4) {
      if($http.status === 200) {
        callback($http.responseXML);
      }
    } else {
      // console.log($http.readyState);
    }
  };
  $http.open('GET', resourcePath, true);
  $http.send();
};

// This initialize method will call on loading time.
function initialize (bookPath) {
  $('iframe').remove();
  window.BookOpts = {
    bookPath     : '',
    opfPath      : '',
    opfRoot      : '',
    appRootURL   : window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1),
    pageMode     : window.innerWidth > window.innerHeight ? 'double' : 'single',
    columnGap    : 60,
    meta         : {},
    $spine       : null,
    $mainfest    : null,
    leftPage     : null,
    NSDictionary : [],
    NSProperties : [],
    NSMedia      : [],
    pages        : [],
    paddingLeft  : 0,
    paddingRight : 0,
    paddingTop   : 50,
    paddingBottom: 50  
  };
  BookOpts.bookPath = bookPath;

  // We create Iframe only once, on navigation time we just change the src of iframe.
  $leftFrame = jQuery('<iframe/>').css('visibility', 'hidden').appendTo('body');
  $rightFrame = jQuery('<iframe/>').css('visibility', 'hidden').appendTo('body');
  getXMLData(bookPath + '/META-INF/container.xml', parser.parseContainerXML);
};

/* This method will load page inside Iframe*/
function loadPage(index) {
  $leftFrame.attr({
    id : 'epub_' + index,
    src: BookOpts.pages[index].src,
    width : $(window).width() - (BookOpts.paddingLeft + BookOpts.paddingRight),
    height: $(window).height() - (BookOpts.paddingTop + BookOpts.paddingBottom),
    frameborder : 0,
    scrolling: 'no'
  }).css('visibility', 'visible');

  $leftFrame.load(function() {
    $leftHtml = $(this).contents().find('html');
    injectJS(this, index);
    if(BookOpts.bookType === 'reflowable') {
      setColumnWidth();
    }
    $(this).css(getPageStyle());
  });
  setNavigationStyles(index);
};

function injectJS(iframeEle, index) {
  var head = iframeEle.contentWindow.window.document.head,
    scriptEle = document.createElement('script');

  scriptEle.id = 'epubby_injectable';
  scriptEle.setAttribute('data-page', index);
  scriptEle.src = BookOpts.appRootURL + 'scripts/injectable.js';
  head.appendChild(scriptEle); 
};

function injectCSS(iframeEle) {
  var head = iframeEle.contentWindow.window.document.head,
    styleEle = document.createElement('link');

  styleEle.href =  BookOpts.appRootURL + 'styles/injectable.css';   
  styleEle.type = "text/css"; 
  styleEle.rel  = "stylesheet";      
  head.appendChild(styleEle);
};

function applyStyle($ele, styleObj){
  $ele.css(styleObj);
};

function setColumnWidth(){
  BookOpts.columnWidth = $(window).width() - (BookOpts.paddingLeft + BookOpts.paddingRight) ;
  $leftHtml.css({
    'height'               : $(window).height() - (BookOpts.paddingTop + BookOpts.paddingBottom) + 'px',
    '-ms-column-width'     :  (BookOpts.columnWidth - BookOpts.columnGap)+ 'px',
    '-ms-column-gap'       : BookOpts.columnGap +'px',
    'column-width'         :  (BookOpts.columnWidth - BookOpts.columnGap)+ 'px',
    'column-gap'           : BookOpts.columnGap +'px',
    '-webkit-column-width' : (BookOpts.columnWidth - BookOpts.columnGap) + 'px',
    '-webkit-column-gap'   : BookOpts.columnGap + 'px',
    'margin-left'          : '0px',
    'padding'              : '0px 30px'
  });
  $leftHtml.find('body').css('overflow', 'hidden');
};

function setNavigationStyles(index) {
  applyStyle($('.prev, .next'), {'opacity': 1, 'cursor': 'pointer' })
  if(index === 0) {
    applyStyle($('.prev'), {'opacity': 0.2, 'cursor': 'default' })
  } 
  if(isLastPage(index)) {
    applyStyle($('.next'), {'opacity': 0.2, 'cursor': 'default' });
  }
}

function next() {
  if(BookOpts.bookType === 'fixed' && !isLastPage(BookOpts.leftPage)) {
    /*Fixed book Navigation.*/
    BookOpts.leftPage = BookOpts.leftPage + 1;
    loadPage(BookOpts.leftPage);
  } else {
    /* Reflowable book Navigation*/
    var isxhtmlPage = BookOpts.pages[BookOpts.leftPage].pageExtension === '.xhtml',
        scrollWidth = $leftHtml[0].scrollWidth,
        currentMarginLeft = Math.abs(parseFloat($leftHtml.css('margin-left'), false)),
        nextMarginLeft = currentMarginLeft + BookOpts.columnWidth;

    scrollWidth = (!(navigator.userAgent.indexOf('MSIE') !== -1 && isxhtmlPage)) ? scrollWidth : (scrollWidth + currentMarginLeft);
    
    /*based on column, load new page or new column */
    if(scrollWidth > nextMarginLeft) {
      applyStyle($leftHtml, {'margin-left': (-nextMarginLeft) + 'px'});
    } else if(!isLastPage(BookOpts.leftPage)){
      BookOpts.leftPage = BookOpts.leftPage + 1;
      loadPage(BookOpts.leftPage);
    }
  }
};

function prev() {
  if(BookOpts.bookType === 'fixed' && !isFirstPage(BookOpts.leftPage)) {
    /*Fixed book Navigation.*/
    BookOpts.leftPage = BookOpts.leftPage - 1;
    loadPage(BookOpts.leftPage);
  } else {
    /* Reflowable book Navigation*/
    var currentMarginLeft = Math.abs(parseFloat($leftHtml.css('margin-left'), false)),
        nextMarginLeft = currentMarginLeft - BookOpts.columnWidth;

    /*based on column, load new page or new column */  
    if(currentMarginLeft !== 0) {
      applyStyle($leftHtml, {'margin-left': (-nextMarginLeft) + 'px'});
    } else if(!isFirstPage(BookOpts.leftPage)){
      BookOpts.leftPage = BookOpts.leftPage - 1;
      loadPage(BookOpts.leftPage);
    }
  }
};
function isLastPage(pageIndex) {
  return pageIndex === (BookOpts.pages.length - 1);
};

function isFirstPage(pageIndex) {
  return pageIndex === 0;
};


function getPageStyle() {
  var windowWidth = $(window).width(),
      windowHeight = $(window).height(),
      bookWidth = ( BookOpts.bookType === 'fixed'
        ? BookOpts.bookWidth
        : windowWidth - BookOpts.paddingLeft - BookOpts.paddingRight
      ),
      bookHeight = ( BookOpts.bookType === 'fixed'
        ? BookOpts.bookHeight
        : windowHeight - BookOpts.paddingTop - BookOpts.paddingBottom
      ),
      scaleV = (windowHeight - (BookOpts.paddingLeft + BookOpts.paddingRight))/ bookHeight,
      scaleH = (windowWidth - (BookOpts.paddingTop + BookOpts.paddingBottom)) / bookWidth,
      scale = scaleV < scaleH ? scaleV : scaleH,
      translateX = Math.abs((windowWidth - (bookWidth * scale)) / 2),
      translateY = Math.abs((windowHeight - (bookHeight * scale)) / 2);

  if(BookOpts.bookType === 'reflowable') {
    translateX = BookOpts.paddingLeft;
    translateY = BookOpts.paddingTop;
    scale = 1;
  }

  $leftFrame.attr({
    width: bookWidth,
    height: bookHeight
  });
  BookOpts.bookHeight = bookHeight;
  return {
    // 'width'           : bookWidth + 'px',
    // 'height'          : bookHeight + 'px',
    'transform'       : 'translate('+ translateX+'px,'+ translateY+'px) scale('+ scale+','+ scale +')',
    'transform-origin': 'left top 0px'
  };
};

var orientationEvent = "onorientationchange" in window ? "orientationchange" : "resize";
$(window).off(orientationEvent).on(orientationEvent, function(){
  BookOpts.pageMode = window.innerWidth > window.innerHeight ? 'double' : 'single';
  $leftFrame.css(getPageStyle());
  if(BookOpts.bookType === 'reflowable') {
    setColumnWidth();
  }
});

window.parser = {
  parseContainerXML : function(containerXML) {
    BookOpts.opfPath = $(containerXML).find('rootfile[media-type="application/oebps-package+xml"]').attr('full-path');
    BookOpts.opfRoot = BookOpts.opfPath.substring(0, BookOpts.opfPath.lastIndexOf('/'));
    getXMLData(BookOpts.bookPath + '/' + BookOpts.opfPath, parser.parseOpfXML);
  },
  pageSize: function(pageHtml) {
    var $meta = $(pageHtml).find('meta[name="viewport"]');
    BookOpts.bookType = $meta.length > 0 ? 'fixed' : 'reflowable';

    if (BookOpts.bookType === 'fixed') {
      BookOpts.metaContent = $meta.attr('content').split(',');
      $.each(BookOpts.metaContent, function(key, val) { BookOpts.metaContent[key] = $.trim(val); });
      BookOpts.bookWidth = parseInt(BookOpts.metaContent[0].substring(0, 6) === 'width=' ? BookOpts.metaContent[0].substring(6) : BookOpts.metaContent[1].substring(6), false);
      BookOpts.bookHeight = parseInt(BookOpts.metaContent[0].substring(0, 7) === 'height=' ? BookOpts.metaContent[0].substring(7) : BookOpts.metaContent[1].substring(7), false);
    }
  },
  parseOpfXML: function(opfXML) {
    var meta = {},
    isValidManifest = -1;
    
    /*parse & get metaData*/
    var $metadata = $(opfXML).find('metadata');
    meta.title = $metadata.children('dc\\:title').text();
    meta.isbn = $metadata.children('dc\\:identifier').text();
    meta.isbn = meta.isbn[meta.isbn.length - 1];
    meta.mediaActiveClass = $metadata.children('meta[property="media:active-class"]').text();
    meta.render = $metadata.children('meta[property="render"]').length > 0 ? $metadata.children('meta[property="render"]').text() : '';
    meta.renderType = $metadata.children('meta[property="render\\:type"]').length > 0 ? $metadata.children('meta[property="render\\:type"]').text() : '';
    
    BookOpts.meta = meta;

    /*get mainfest object*/
    BookOpts.$manifest = $(opfXML).find('manifest,opf\\:manifest');
    BookOpts.$manifest.children().each(function () {
      BookOpts.NSDictionary[$(this).attr('id')] = $(this).attr('href');
      if($(this).attr('media-overlay')) {
        BookOpts.NSMedia[$(this).attr('id')] = $(this).attr('media-overlay');
      }
      if($(this).attr('properties')) {
        BookOpts.NSProperties[$(this).attr('id')] = $(this).attr('properties');
      }
    });

    /*get spine object*/
    BookOpts.$spine = $(opfXML).find('spine');

    var $currentSpineIdref = null;
    BookOpts.$spine.children().each(function () {
      $currentSpineIdref = $(this).attr('idref');
      BookOpts.ns = BookOpts.NSDictionary[$currentSpineIdref];
      if (BookOpts.ns !== '') {
        BookOpts.pages.push({
          'bookPath'      : BookOpts.bookPath,
          'page'          : BookOpts.ns,
          'opfRoot'       : BookOpts.opfRoot,
          'src'           : BookOpts.bookPath + '/' + BookOpts.opfRoot + '/' + BookOpts.ns,
          'relativeSrc'   : BookOpts.opfRoot + '/' + BookOpts.ns,
          'smil'          : BookOpts.NSDictionary[BookOpts.NSMedia[$currentSpineIdref]] || null,
          'mathml'        : BookOpts.NSProperties[$currentSpineIdref] === 'mathml',
          'pageExtension' : BookOpts.ns.substr(BookOpts.ns.lastIndexOf('.')),
          'pageIndex'     : BookOpts.pages.length,
        });
      }
    });
    getXMLData(BookOpts.pages[0].src, parser.pageSize);
    BookOpts.leftPage = 0;
    loadPage(BookOpts.leftPage);
  }
};
