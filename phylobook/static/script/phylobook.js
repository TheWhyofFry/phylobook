
// Notes editor, buttons/listeners, contextmenus etc.
tinymce.init({
    selector: '.notes',
    inline: true,
    menubar: false,
    content_style: "p { margin: 0; }",
    save_enablewhendirty: true,
    plugins: [
    'save',
    'link',
    'lists',
    'autolink',
    ],
    color_map: [
        "000000", "Black",
        "FF0000", "Red",
        "EFE645", "Yellow",
        "E935A1", "Pink",
        "00E3FF", "Light Blue",
        "FFA500", "Orange",
        "537EFF", "Neon Blue",
        "00CB85", "Green",
    ],
    toolbar: [
    'save undo redo | bold italic underline | fontselect fontsizeselect',
    'forecolor backcolor | alignleft aligncenter alignright alignfull | numlist bullist outdent indent'
    ],
    valid_elements: 'p[style],strong,em,span[style],a[href],ul,ol,li',
    valid_styles: {
    '*': 'font-size,font-family,color,text-decoration,text-align,background-color'
    },
    powerpaste_word_import: 'clean',
    powerpaste_html_import: 'clean',
    setup:function(ed) {
        ed.on('change', function(e) {
           $("#" + ed.id).closest(".tree").addClass("editedhighlight");
       });
    },
    //Save button call back function
    save_onsavecallback: function () {
        var content = tinymce.activeEditor.getContent();
        var id = tinymce.activeEditor.id.replace("notes-", "");
        var svg = $("#" + id).find(".svgimage").html();
        var proj = $("#project").val();
        $.ajax({
            type: "POST",
            headers: { "X-CSRFToken": token },
            url: '/projects/note/update/' + proj + "/" + id,
            data: { "notes": content },
            success: function() {
                $.ajax({
                    type: "POST",
                    headers: { "X-CSRFToken": token },
                    url: '/projects/svg/update/' + proj + "/" + id,
                    data: { "svg": svg },
                    success: function() {
                        $("#" + tinymce.activeEditor.id).closest(".tree").removeClass("editedhighlight");
                        alert( id + " saved successfully." );
                    },
                    error: function (err) {
                        alert( id + " Failed to save!!!  Contact dev team." );
                    }
                });
            },
            error: function (err) {
                alert( id + " Failed to save!!!  Contact dev team." );
            }
        });
    }
});

function setAllDirtyUnsaved() {
    $('.tree').each(function(i, obj) {
        var noteId = $(this).children(".notes").first().attr("id");
        setDirtyUnsaved(noteId);
    });
}

function setDirtyUnsaved(edId) {
    $("#" + edId).closest(".tree").addClass("editedhighlight");
    tinyMCE.get(edId).setDirty(true);
}

function setDirtySaved(edId) {
    $("#" + edId).closest(".tree").removeClass("editedhighlight");
    tinyMCE.get(edId).setDirty(false);
}

window.addEventListener('beforeunload', function (e) {
    var isDirty = false;
    var dirtyEditors = [];
    for (inst in tinyMCE.editors) {
        let dirty = tinyMCE.editors[inst].isDirty();
        if (dirty) {
            dirtyEditors.push(tinyMCE.editors[inst].id);
            isDirty = true;
        }
    }
    if(isDirty) {
        //following two lines will cause the browser to ask the user if they
        //want to leave. The text of this dialog is controlled by the browser.
        e.preventDefault(); //per the standard
        e.returnValue = ''; //required for Chrome
    }
    //else: user is allowed to leave without a warning dialog
});

function updateProgress(percentage) {
    if(percentage > 100) percentage = 100;
    $('#progressBar').css('width', percentage+'%');
    $('#progressBar').attr('aria-valuenow', percentage);
    $('#progressBar').html(percentage+'%');
}

function saveAll() {
    updateProgress(0);
    var treescount = $('.tree').length;
    var treesdone = 0;
    $('.tree').each(function(i, obj) {
        $("#saveallprog").removeClass("hide");
        var noteId = $(this).children(".notes").first().attr("id");
        var content = tinymce.get(noteId).getContent();
        var id = noteId.replace("notes-", "");
        var svg = $("#" + id).find(".svgimage").html();
        var proj = $("#project").val();
        $.ajax({
            type: "POST",
            headers: { "X-CSRFToken": token },
            url: '/projects/note/update/' + proj + "/" + id,
            data: { "notes": content },
            success: function() {
                $.ajax({
                    type: "POST",
                    headers: { "X-CSRFToken": token },
                    url: '/projects/svg/update/' + proj + "/" + id,
                    data: { "svg": svg },
                    success: function() {
                        setDirtySaved(noteId);
                        treesdone++;
                        updateProgress(Math.round((treesdone/treescount)*100));
                        if (treesdone == treescount) {
                            setTimeout(function() {
                              $("#saveallprog").addClass("hide");
                            }, 2000);

                        }
                    },
                    error: function (err) {
                        alert( id + " Failed to save!!!  Contact dev team." );
                    }
                });
            },
            error: function (err) {
                alert( id + " Failed to save!!!  Contact dev team." );
            }
        });

    });

}

$(document).ready(function() {
    $( "#saveall" ).on( "click", function() {
        saveAll();
    });
    $( "#removesequencecolor" ).on( "click", function() {
        removeAllSeqnum();
    });
    $( "#sequencecolor" ).on( "click", function() {
        removeAllSeqnum();
        d3.selectAll('text').each(function(d) {
            var label = d3.select(this);
            var min = $("#min").val();
            var max = $("#max").val();
            var lastunderscore = label.text().lastIndexOf("_");
            var numseqs = parseInt(label.text().substring(label.text().lastIndexOf("_") + 1));
            var labelcolor = [];
            if (numseqs < min || lastunderscore == -1) {
                return;
            } else if (numseqs >= max) {
                var values = $( "#slider-range" ).slider( "values");
                labelcolor = pickHex([255, 0, 0], [255, 255, 0], values[ 1 ]/100);
            } else if (numseqs == min) {
                var values = $( "#slider-range" ).slider( "values");
                labelcolor = pickHex([255, 0, 0], [255, 255, 0], values[ 0 ]/100);
            } else if (numseqs >= min) {
                var incrementweight = 100/(max - min);
                var weight = ((numseqs - min) * incrementweight)/100;
                var values = $( "#slider-range" ).slider( "values");
                var minColor = pickHex([255, 0, 0], [255, 255, 0], values[ 0 ]/100);
                var maxColor = pickHex([255, 0, 0], [255, 255, 0], values[ 1 ]/100);
                var labelcolor = pickHex(maxColor, minColor, weight);
            }

            var currentSelectedTextNode = label.node();
            var svgcanvas = d3.select(currentSelectedTextNode.parentNode);
            var rect = currentSelectedTextNode.getBBox();
            var square = d3.symbol().size("36").type(d3.symbolSquare);

            // if there is a transform, grab the x, y
            if (label.attr("transform") != null) {
                rect.x = label.node().transform.baseVal[0].matrix.e - 2;
                rect.y = label.node().transform.baseVal[0].matrix.f + 2;
            }

            svgcanvas
                .append("path")
                .attr("d", square)
                .attr('class', 'seqnum')
                .attr("transform", "translate(" + (rect.x - 4) + "," + (rect.y + 4) + ")")
                .style('fill', rgb(labelcolor[0],labelcolor[1],labelcolor[2]))
                .style("stroke", rgb(labelcolor[0],labelcolor[1],labelcolor[2]));

        });
        setAllDirtyUnsaved();
    });

    function removeAllSeqnum() {
        d3.selectAll(".seqnum").each(function(d, i) {
            d3.select(this).remove();
        });
        setAllDirtyUnsaved();
    }

    ///////
    const contextMenu = document.getElementById("context-menu");
    const contextMenuCircle = document.getElementById("context-menu-circle");
    const scope = document.querySelector("body");
    var currentSelectedText = "";
    var currentSelectedCircleParent = "";
    var currentSelectedCircleEvent = "";
    var isCircleSelected = false;
    var currentSelectedCircle = "";

    const normalizePozition = (mouseX, mouseY, menu) => {
        // ? compute what is the mouse position relative to the container element (scope)
        const {
          left: scopeOffsetX,
          top: scopeOffsetY,
        } = scope.getBoundingClientRect();

        const scopeX = mouseX - scopeOffsetX;
        const scopeY = mouseY - scopeOffsetY;

        // ? check if the element will go out of bounds
        const outOfBoundsOnX =
          scopeX + menu.clientWidth > scope.clientWidth;

        const outOfBoundsOnY =
          scopeY + menu.clientHeight > scope.clientHeight;

        let normalizedX = mouseX;
        let normalizedY = mouseY;

        // ? normalzie on X
        if (outOfBoundsOnX) {
          normalizedX =
            scopeOffsetX + scope.clientWidth - menu.clientWidth;
        }

        // ? normalize on Y
        if (outOfBoundsOnY) {
          normalizedY =
            scopeOffsetY + scope.clientHeight - menu.clientHeight;
        }

        return { normalizedX, normalizedY };
    };
    function hideContextMenu() {
         contextMenu.classList.remove("visible");
         contextMenuCircle.classList.remove("visible");
         currentSelectedText = "";
         currentSelectedCircleParent = "";
         currentSelectedCircleEvent = "";
         isCircleSelected = false;
         currentSelectedCircle = "";
    }

    // hide contextMenu if scroll happens while displayed
    window.onscroll = function() {
        hideContextMenu();
    };
    window.addEventListener("click", (e) => {
        // ? close the menu if the user clicks outside of it
        if (e.target.offsetParent != contextMenu && e.target.offsetParent != contextMenuCircle) {
            hideContextMenu();
        } else if (e.target.offsetParent == contextMenuCircle) {
            var colorText = $(e.target).attr("id");
            var color = getColor(colorText.replace("circle", ""));
            if (colorText == "circleremove" && isCircleSelected) {
                setDirtyUnsaved("notes-" + $(currentSelectedCircle).closest(".imgparent").attr("id"));
                d3.select(currentSelectedCircle).remove();
                hideContextMenu();
                return;
            } else if (isCircleSelected) {
                d3.select(currentSelectedCircle).style("fill", color);
                setDirtyUnsaved("notes-" + $(currentSelectedCircle).closest(".imgparent").attr("id"));
                hideContextMenu();
                return;
            }
            var newcircle = drawCircleMarker(color);
            setDirtyUnsaved("notes-" + $(newcircle.node()).closest(".imgparent").attr("id"));
            hideContextMenu();
        } else if (e.target.offsetParent == contextMenu)  {
            var currentSelectedTextNode = currentSelectedText.node();
            var svgcanvas = d3.select(currentSelectedTextNode.parentNode);
            var rect = currentSelectedTextNode.getBBox();
            var offset = 2; // enlarge rect box 2 px on left & right side
            currentSelectedText.classed("mute", (currentSelectedText.classed("mute") ? false : true));
            var labelText = currentSelectedText.text();
            var colorText = $(e.target).attr("id");
            var existingColoredBox = d3.select("#" + labelText);
            if (colorText == "boxremove") {
                existingColoredBox.remove();
                hideContextMenu();
                setDirtyUnsaved("notes-" + $(currentSelectedText.node()).closest(".imgparent").attr("id"));
                return;
            }
            var color = getColor(colorText.replace("box", ""));

            // if there is a transform, grab the x, y
            if (currentSelectedText.attr("transform") != null) {
                rect.x = currentSelectedText.node().transform.baseVal[0].matrix.e;
                rect.y = currentSelectedText.node().transform.baseVal[0].matrix.f + 1;
            }

            pathinfo = [
                {x: rect.x-offset, y: rect.y },
                {x: rect.x+offset + rect.width, y: rect.y},
                {x: rect.x+offset + rect.width, y: rect.y + rect.height },
                {x: rect.x-offset, y: rect.y + rect.height},
                {x: rect.x-offset, y: rect.y },
            ];

            if (existingColoredBox.node()) {
                existingColoredBox.style("stroke", color);
            } else {
                // Specify the function for generating path data
                var d3line = d3.line()
                    .x(function(d){return d.x;})
                    .y(function(d){return d.y;})
                    .curve(d3.curveLinear);

                // Draw the line
                svgcanvas.append("path")
                    .attr("id", labelText)
                    .attr("d", d3line(pathinfo))
                    .style("stroke-width", 1)
                    .style("stroke", color)
                    .style("fill", "none");
            }
            setDirtyUnsaved("notes-" + $(currentSelectedText.node()).closest(".imgparent").attr("id"));
            hideContextMenu();
        }
    });

    window.addEventListener('contextmenu', function(e) {
        if (e.target.tagName.toLowerCase() == 'text') {
            e.preventDefault();
            const { clientX: mouseX, clientY: mouseY } = e;
            const { normalizedX, normalizedY } = normalizePozition(mouseX, mouseY, contextMenu);
            hideContextMenu();
            contextMenu.style.top = `${normalizedY}px`;
            contextMenu.style.left = `${normalizedX}px`;

            setTimeout(() => {
              contextMenu.classList.add("visible");
            });
            currentSelectedText = d3.select(e.target);
        } else if (e.target.tagName.toLowerCase() == 'circle') {
            e.preventDefault();
            contextMenu.classList.remove("visible");
            isCircleSelected = true;
            currentSelectedCircle = e.target;
            showContextMenuCircle(e, contextMenuCircle);
        } else if (e.target.tagName.toLowerCase() == 'svg') {
            e.preventDefault();
            contextMenu.classList.remove("visible");
            currentSelectedCircleParent = e.target;
            currentSelectedCircleEvent = e;
            showContextMenuCircle(e, contextMenuCircle);
            //drawCircleMarker(e.target, e);
        } else if (e.target.ownerSVGElement) {
            e.preventDefault();
            currentSelectedCircleParent = e.target.ownerSVGElement;
            currentSelectedCircleEvent = e;
            showContextMenuCircle(e, contextMenuCircle);
            //drawCircleMarker(e.target.ownerSVGElement, e);
        }
    });

    function showContextMenuCircle(e, cMenu) {
        const { clientX: mouseX, clientY: mouseY } = e;
        const { normalizedX, normalizedY } = normalizePozition(mouseX, mouseY, cMenu);
        cMenu.style.top = `${normalizedY}px`;
        cMenu.style.left = `${normalizedX}px`;

        setTimeout(() => {
          cMenu.classList.add("visible");
        });
    }

    function drawCircleMarker(color) {
        var xy = d3.pointer(currentSelectedCircleEvent, currentSelectedCircleParent);
        return d3.select(currentSelectedCircleParent)
        .append('circle')
        .attr('cx', xy[0])
        .attr('cy', xy[1])
        .attr('r', 3)
        .style('fill', color)
        .call(drag);
    }

    // Define drag beavior
    var drag = d3.drag()
        .on("drag", dragged);

    function dragged(event, d) {
        d3.select(this).attr("cx", event.x).attr("cy", event.y);
    }

    function getColor(name) {
        if (name == "red") {
            return "red";
        } else if (name == "yellow") {
            return "#efe645";
        } else if (name == "pink") {
            return "#e935a1";
        } else if (name == "lightblue") {
            return "#00e3ff";
        } else if (name == "orange") {
            return "orange";
        } else if (name == "neonblue") {
            return "#537eff";
        } else if (name == "green") {
            return "#00cb85";
        }
    }
});

// Slider/colorization functions
$( function() {
    $( "#slider-range" ).slider({
        range: true,
        min: 1,
        max: 100,
        values: [ 1, 100 ],
        create: function( event, ui ) {
            // color between rage sliders
            var markers=$(this).slider('values');
            minColor = pickHex([255, 0, 0], [255, 255, 0], markers[ 0 ]/100);
            maxColor = pickHex([255, 0, 0], [255, 255, 0], markers[ 1 ]/100);
            $( "#slider-range .ui-slider-range" ).css("background-image", "linear-gradient(to right, " + rgb(minColor[0],minColor[1],minColor[2]) + ", " + rgb(maxColor[0],maxColor[1],maxColor[2]) + ")");
        },
        slide: function( event, ui ) {
            $( "#amount" ).val( "$" + ui.values[ 0 ] + " - $" + ui.values[ 1 ] );
            // color between rage sliders
            minColor = pickHex([255, 0, 0], [255, 255, 0], ui.values[ 0 ]/100);
            maxColor = pickHex([255, 0, 0], [255, 255, 0], ui.values[ 1 ]/100);
            $( "#slider-range .ui-slider-range" ).css("background-image", "linear-gradient(to right, " + rgb(minColor[0],minColor[1],minColor[2]) + ", " + rgb(maxColor[0],maxColor[1],maxColor[2]) + ")");
        }
    });
});
function rgb(r, g, b){
    return ["rgb(",r,",",g,",",b,")"].join("");
}
function pickHex(color1, color2, weight) {
    var p = weight;
    var w = p * 2 - 1;
    var w1 = (w/1+1) / 2;
    var w2 = 1 - w1;
    var rgb = [Math.round(color1[0] * w1 + color2[0] * w2),
        Math.round(color1[1] * w1 + color2[1] * w2),
        Math.round(color1[2] * w1 + color2[2] * w2)];
    return rgb;
}

//