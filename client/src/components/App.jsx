import React, {useEffect, useState} from 'react';

import '../styles/style.css';

const App = function() {
  const [points, setPoints] = useState(5);
  const [angle, setAngle]   = useState((360/points)/2);
  const [mandalaImages, setMandalaImages]     = useState([]);
  const [currentImage, setCurrentImage]       = useState(null);
  const [mainImageSource, setMainImageSource] = useState("https://i.imgur.com/ArMb4g8.png");

  const [ready, setReady] = useState(false);

  const [bufferSize, setBufferSize] = useState(1200);

  var sliceImage   = new Image();
  var flippedImage = new Image();
  var fullSlice    = new Image();
  var finalImage   = new Image();

  var bufferElement = document.getElementById("buffer");
  var buffer        = bufferElement.getContext("2d");

  bufferElement.width  = bufferSize;
  bufferElement.height = bufferSize;

  var loadImage = function(event) {
    var input = event.target;

    if (input.files && input.files[0]) {
      var reader = new FileReader();

      reader.readAsDataURL(input.files[0]);

      reader.onload = function(e) {
        var img = new Image();

        handleBlob(e.target.result, img, function() {
          imageHandle.scaleAndCropImage(img, bufferElement.width, bufferElement.height);
        });
      };
    }
  };

  var downloadImage = function() {
    if (mandalaImages.length === 0) {return};

    var link = document.createElement('a');

    link.href = mainImageSource;
    link.download = 'mandala.png';

    link.click();
  };

  var updatePoints = function() {
    var newPoints = document.getElementById('numPointsInput').value;

    if (Number(newPoints) && newPoints >= 3) {
      setPoints(newPoints);
      setAngle((360/newPoints)/2);
    } else {
      alert('Please enter a valid number of points (minimum 3).');
    }
  };

  var updateSize = function() {
    var newSize = Number(document.getElementById('sizeInput').value);

    if (newSize && newSize >= 800 && newSize <= 3300) {
      setBufferSize(newSize);

      imageHandle.scaleAndCropImage(currentImage, newSize, newSize);
    } else {
      alert('Please enter a number between 800 and 3300.');
    }
  };

  var imageHandle = {
    rotate: function(image, d, a, t) {
      buffer.clearRect(0, 0, bufferElement.width, bufferElement.height);
      buffer.save();
      buffer.translate(bufferElement.width / 2 + t, bufferElement.height / 2);
      buffer.rotate((a + d) * Math.PI / 180);
      buffer.drawImage(image, -image.width / 2, -image.height / 2);
      buffer.restore();

      buffer.clearRect(0, 0, bufferElement.width / 2, bufferElement.height);
    },
    halfSlice: function(img, d) {
      buffer.clearRect(0, 0, bufferElement.width, bufferElement.height);
      buffer.save();
      buffer.translate(img.width / 2, img.height / 2);
      buffer.rotate(-d * Math.PI / 180);
      buffer.drawImage(img, -img.width / 2, -img.height / 2);
      buffer.restore();
      buffer.clearRect(bufferElement.width / 2, 0, bufferElement.width / 2, bufferElement.height);
    },
    fullSlice: function(img) {
      buffer.clearRect(0, 0, bufferElement.width, bufferElement.height);
      buffer.drawImage(img, 0, 0);
      buffer.save();
      buffer.translate(bufferElement.width, 0);
      buffer.scale(-1, 1);
      buffer.drawImage(img, 0, 0, bufferElement.width / 2, bufferElement.height, 0, 0, bufferElement.width / 2, bufferElement.height);
      buffer.restore();
    },

    scaleAndCropImage: function(img, width, height) {
      var aspectRatio = img.width / img.height;
      var scaledWidth, scaledHeight, dx, dy;

      bufferElement.width  = width;
      bufferElement.height = height;

      if (img.width > img.height) {
        scaledWidth  = height * (img.width / img.height);
        scaledHeight = height;
        dx = (width - scaledWidth) / 2;
        dy = 0;
      } else {
        scaledWidth  = width;
        scaledHeight = width * (img.height / img.width);
        dx = 0;
        dy = (height - scaledHeight) / 2;
      }

      buffer.clearRect(0, 0, width, height);
      buffer.drawImage(img, dx, dy, scaledWidth, scaledHeight);

      var scaledImage = new Image();

      handleBlob(canvasData(), scaledImage, function() {
        setCurrentImage(scaledImage);
        saveMandala(scaledImage);
        setReady(true);
      });
    },
    cropToCircle: function(image) {
      var size = bufferSize + 10;
      bufferElement.width  = size;
      bufferElement.height = size;

      buffer.beginPath();
      buffer.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
      buffer.closePath();
      buffer.clip();

      buffer.clearRect(0, 0, bufferElement.width, bufferElement.height);
      buffer.drawImage(image, 0, 0, size, size);

      var croppedImage = new Image();

      handleBlob(canvasData(), croppedImage, function() {
        saveMandala(croppedImage);
        setMainImageSource(croppedImage.src);
        setReady(true);
      });
    }
  };

  var generateMandala = function() {
    if (!currentImage) {
      alert('Please upload image first.');
      return;
    }

    if (!ready) {return};

    setReady(false);

    var drawSlice = function(degrees) {
      var angleOffset = Math.floor(Math.random() * 360) + 1;
      var translationOffset = Math.floor(Math.random() * (currentImage.width * 0.25));

      imageHandle.rotate(currentImage, degrees, angleOffset, translationOffset);

      handleBlob(canvasData(), sliceImage, function() {
        imageHandle.halfSlice(sliceImage, degrees);

        handleBlob(canvasData(), flippedImage, processFlippedImage);
      })
    };

    var processFlippedImage = function() {
      imageHandle.fullSlice(flippedImage);

      handleBlob(canvasData(), fullSlice, processFullSlice);
    };

    var processFullSlice = function() {
      buffer.fillStyle = 'white';
      buffer.fillRect(0, 0, bufferElement.width, bufferElement.height);

      buffer.save();
      buffer.translate(bufferElement.width / 2, bufferElement.height / 2);

      for (var i = 0; i < (360 / angle); i++) {
        buffer.rotate((angle * 2) * Math.PI / 180);
        buffer.drawImage(fullSlice, -fullSlice.width / 2, -fullSlice.height / 2);
      }

      buffer.restore();

      handleBlob(canvasData(), finalImage, processFinalImage);
    };

    var processFinalImage = function() {
      imageHandle.cropToCircle(finalImage);
    };

    drawSlice(angle);
  };

  var saveMandala = function(image) {
    var updated = [image, ...mandalaImages];

    setMandalaImages(updated);
  };

  var loadMandala = function(e) {
    setMainImageSource(e.target.src);
  };

  var renderMandalaList = function() {
    var rendered = [];

    for (var i = 0; i < mandalaImages.length; i++) {
      rendered.push(<img className='mandala-thumbnail' src={mandalaImages[i].src} onClick={loadMandala}/>)
    };

    return rendered;
  };

  var canvasData = function() {
    return bufferElement.toDataURL('image/png', 1);
  };

  var handleBlob = function(data, image, cb) {
    fetch(data)
      .then(res => res.blob())
      .then(blob => {
        image.src = URL.createObjectURL(blob);
        image.onload = cb;
      });
  };

  return (
    <div className="container">
      <div className="nav">
        <h2>ink.gen</h2>
        <div>
          <button id="uploadButton" onClick={()=>{document.getElementById('imageInput').click()}}>Load Image</button>
          <input type="file" id="imageInput" style={{display: 'none'}} onChange={loadImage}/>
          Points:
          <input type="number" id="numPointsInput" min="3" max="360" defaultValue="5" onChange={updatePoints}/>
          Size:
          <input id="sizeInput" defaultValue={bufferSize}/>
          <button onClick={updateSize}>Update</button>
          <button onClick={generateMandala} className={ready ? 'ready' : 'notReady'}>Generate Mandala</button>
          <button onClick={downloadImage}>Download</button>
        </div>
      </div>
      <div style={{position: 'relative'}}>
        <div className="mandalaList" style={mandalaImages.length > 0 ? {visibility: 'visible'} : {visibility: 'hidden'}}>
          {renderMandalaList()}
        </div>
        <img id="mainImage" src={mainImageSource}/>
      </div>
    </div>
  )
};

export default App;

