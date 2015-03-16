/*
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2015 (original work) Open Assessment Technologies SA ;
 *
 */


/**
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
define([
    'jquery',
    'lodash',
    'i18n',
    'taoQtiItem/qtiCommonRenderer/helpers/Graphic',
    'taoQtiItem/qtiCreator/widgets/states/factory',
    'taoQtiItem/qtiCreator/widgets/interactions/blockInteraction/states/Question',
    'taoQtiItem/qtiCreator/widgets/interactions/helpers/graphicInteractionShapeEditor',
    'taoQtiItem/qtiCreator/widgets/interactions/helpers/imageSelector',
    'taoQtiItem/qtiCreator/widgets/helpers/formElement',
    'taoQtiItem/qtiCreator/widgets/helpers/identifier',

    'tpl!taoQtiItem/qtiCreator/tpl/forms/interactions/graphicGapMatch',
    'tpl!taoQtiItem/qtiCreator/tpl/forms/choices/associableHotspot',
    'tpl!taoQtiItem/qtiCreator/tpl/forms/choices/gapImg',
    'tpl!taoQtiItem/qtiCreator/tpl/toolbars/media',

    'taoQtiItem/qtiCreator/helper/dummyElement',
    'taoQtiItem/qtiCreator/helper/panel',
    'taoQtiItem/qtiCreator/widgets/interactions/helpers/resourceManager',

    'ui/mediasizer'
], function ($, _, __, GraphicHelper, stateFactory, Question, shapeEditor, imageSelector, formElement, identifierHelper, formTpl, choiceFormTpl, gapImgFormTpl, mediaTlbTpl, dummyElement, panel, resourceManager) {

    "use strict";

    /**
     * Question State initialization: set up side bar, editors and shae factory
     */
    var initQuestionState = function initQuestionState() {

        var widget = this.widget;
        var interaction = widget.element;
        var options = widget.options;
        var paper = interaction.paper;

        var gapImgSelectorOptions = _.clone(options);
        gapImgSelectorOptions.title = gapImgSelectorOptions.title
            ? gapImgSelectorOptions.title
            : __('Please select a choice picture for your interaction from the resource manager. \
                  You can add new files from your computer with the button "Add file(s)".');

        if (!paper) {
            return;
        }

        var $choiceForm = widget.choiceForm;
        var $formInteractionPanel = $('#item-editor-interaction-property-bar');
        var $formChoicePanel = $('#item-editor-choice-property-bar');

        var $left, $top, $width, $height;

        //instantiate the shape editor, attach it to the widget to retrieve it during the exit phase
        widget._editor = shapeEditor(widget, {
            shapeCreated: function (shape, type) {
                var newChoice = interaction.createChoice({
                    shape: type === 'path' ? 'poly' : type,
                    coords: GraphicHelper.qtiCoords(shape)
                });

                //link the shape to the choice
                shape.id = newChoice.serial;
            },
            shapeRemoved: function (id) {
                interaction.removeChoice(id);
            },
            enterHandling: function (shape) {
                enterChoiceForm(shape.id);
            },
            quitHandling: function () {
                leaveChoiceForm();
            },
            shapeChange: function (shape) {
                var bbox;
                var choice = interaction.getChoice(shape.id);
                if (choice) {
                    choice.attr('coords', GraphicHelper.qtiCoords(shape));

                    if ($left && $left.length) {
                        bbox = shape.getBBox();
                        $left.val(parseInt(bbox.x, 10));
                        $top.val(parseInt(bbox.y, 10));
                        $width.val(parseInt(bbox.width, 10));
                        $height.val(parseInt(bbox.height, 10));
                    }
                }
            }
        });

        //and create an instance
        widget._editor.create();

        _.forEach(interaction.getGapImgs(), setUpGapImg);

        createGapImgAddOption();

        // stop the question mode on resize to keep the coordinate system coherent,
        // even in responsive (the side bar behaves weirdly)
        $(window).on('resize.changestate', function () {
            widget.changeState('sleep');
        });


        /**
         * Create the 'add option' button
         */
        function createGapImgAddOption() {
            var $gapList = $('ul.source', widget.$original);
            var $addOption =
                $('<li class="empty add-option">' +
                    '<div><span class="icon-add"></span></div>' +
                    '</li>');

            $addOption.on('click', function () {
                var gapImgObj = interaction.createGapImg({});
                gapImgObj.object.removeAttr('type');

                // on successful upload
                $addOption.on('selected.upload', function (e, args) {
                    gapImgObj.object.attr('data', args.selected.file);
                    gapImgObj.object.attr('type', args.selected.mime);
                    gapImgObj.object.attr('width', args.size.width);
                    gapImgObj.object.attr('height', args.size.height);
                    setUpGapImg(gapImgObj);
                });
                resourceManager($addOption, gapImgSelectorOptions);

            });
            $addOption.appendTo($gapList);
        }


        /**
         * Insert and setup the gap image
         *
         * @param gapImgObj
         */
        function setUpGapImg(gapImgObj) {

            var $gapList = $('ul.source', widget.$original);
            var $addOption = $('.empty', $gapList);
            var $gapImgBox = $('[data-serial="' + gapImgObj.serial + '"]', $gapList);
            var $deleteBtn = $(mediaTlbTpl());

            // on first creation but not on update
            if (!$gapImgBox.length) {
                $gapImgBox = $('<li/>').insertBefore($addOption);
                $gapImgBox.data('serial', gapImgObj.serial)
                    .attr('data-serial', gapImgObj.serial)
                    .addClass('qti-choice qti-gapImg active widget-box');
            }

            $gapImgBox.replaceWith(gapImgObj.render());
            $gapImgBox = $('[data-serial="' + gapImgObj.serial + '"]', $gapList);

            //manage gap deletion
            $deleteBtn
                .appendTo($gapImgBox)
                .show()
                .click(function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    $gapImgBox.remove();
                    interaction.removeGapImg(gapImgObj);
                });

            enterGapImgForm(gapImgObj.serial);

            $gapImgBox.off('click').on('click', function () {
                if ($gapImgBox.hasClass('active')) {
                    $gapImgBox.removeClass('active');
                    leaveChoiceForm();
                }
                else {
                    $('.active', $gapList).removeClass('active');
                    $gapImgBox.addClass('active');
                    enterGapImgForm(gapImgObj.serial);
                }
            });
        }

        /**
         * Set up the choice form
         *
         * @private
         * @param {String} serial - the choice serial
         */
        function enterChoiceForm(serial) {
            var choice = interaction.getChoice(serial);
            var element, bbox;

            if (choice) {

                //get shape bounding box
                element = interaction.paper.getById(serial);
                bbox = element.getBBox();

                $choiceForm.empty().html(
                    choiceFormTpl({
                        identifier: choice.id(),
                        fixed: choice.attr('fixed'),
                        serial: serial,
                        matchMin: choice.attr('matchMin'),
                        matchMax: choice.attr('matchMax'),
                        choicesCount: _.size(interaction.getChoices()),
                        x: parseInt(bbox.x, 10),
                        y: parseInt(bbox.y, 10),
                        width: parseInt(bbox.width, 10),
                        height: parseInt(bbox.height, 10)
                    })
                );

                formElement.initWidget($choiceForm);

                //init data validation and binding
                var callbacks = formElement.getMinMaxAttributeCallbacks($choiceForm, 'matchMin', 'matchMax');
                callbacks.identifier = identifierHelper.updateChoiceIdentifier;
                callbacks.fixed = formElement.getAttributeChangeCallback();

                formElement.setChangeCallbacks($choiceForm, choice, callbacks);

                $formChoicePanel.show();
                panel.openSections($formChoicePanel.children('section'));
                panel.closeSections($formInteractionPanel.children('section'));

                //change the nodes bound to the position fields
                $left = $('input[name=x]', $choiceForm);
                $top = $('input[name=y]', $choiceForm);
                $width = $('input[name=width]', $choiceForm);
                $height = $('input[name=height]', $choiceForm);
            }
        }

        /**
         * Leave the choice form
         * @private
         */
        function leaveChoiceForm() {
            if ($formChoicePanel.css('display') !== 'none') {
                panel.openSections($formInteractionPanel.children('section'));
                $formChoicePanel.hide();
                $choiceForm.empty();
            }
        }

        /**
         * Set up the gapImg form
         * @private
         * @param {String} serial - the gapImg serial
         */
        function enterGapImgForm(serial) {

            var callbacks,
                gapImg = interaction.getGapImg(serial),
                $gapImgBox,
                $gapImgElem,
                $mediaSizer;

            if (gapImg) {

                $choiceForm.empty().html(gapImgFormTpl({
                    identifier: gapImg.id(),
                    fixed: gapImg.attr('fixed'),
                    serial: serial,
                    matchMin: gapImg.attr('matchMin'),
                    matchMax: gapImg.attr('matchMax'),
                    choicesCount: _.size(interaction.getChoices()),
                    baseUrl: options.baseUrl,
                    data: gapImg.object.attr('data'),
                    width: gapImg.object.attr('width'),
                    height: gapImg.object.attr('height'),
                    type: gapImg.object.attr('type')
                }));

                // <li/> that will contain the image
                $gapImgBox = $('li[data-serial="' + gapImg.serial + '"]');

                $gapImgElem = $gapImgBox.find('img');

                //init media sizer
                $mediaSizer = $choiceForm.find('.media-sizer-panel');

                $mediaSizer.empty().mediasizer({
                    target: $gapImgElem,
                    showResponsiveToggle: false,
                    showSync: false,
                    responsive: false,
                    parentSelector: $gapImgBox
                });

                imageSelector($choiceForm, gapImgSelectorOptions);

                formElement.initWidget($choiceForm);

                // bind callbacks to ms
                // init data validation and binding
                callbacks = formElement.getMinMaxAttributeCallbacks($choiceForm, 'matchMin', 'matchMax');
                callbacks.identifier = identifierHelper.updateChoiceIdentifier;
                callbacks.fixed = formElement.getAttributeChangeCallback();
                callbacks.data = function (element, value) {
                    gapImg.object.attr('data', value);
                    setUpGapImg(gapImg);
                };

                // callbacks
                $mediaSizer.on('sizechange.mediasizer', function(e, params) {
                    gapImg.object.attr('width', params.width);
                    gapImg.object.attr('height', params.height);
                });

                callbacks.type = function (element, value) {
                    if (!value || value === '') {
                        interaction.object.removeAttr('type');
                    }
                    else {
                        gapImg.object.attr('type', value);
                    }
                };
                formElement.setChangeCallbacks($choiceForm, gapImg, callbacks);

                $formChoicePanel.show();
                panel.openSections($formChoicePanel.children('section'));
                panel.closeSections($formInteractionPanel.children('section'));

                if (typeof window.scroll === 'function') {
                    window.scroll(0, $choiceForm.offset().top);
                }
            }
        }
    };

    /**
     * Exit the question state, leave the room cleaned up
     */
    var exitQuestionState = function initQuestionState() {
        var widget = this.widget;
        var interaction = widget.element;
        var paper = interaction.paper;

        if (!paper) {
            return;
        }


        $(window).off('resize.changestate');

        if (widget._editor) {
            widget._editor.destroy();
        }

        //remove gapImg placeholder
        $('ul.source .empty', widget.$original).remove();

        //restore gapImg appearance
        widget.$container.find('.qti-gapImg').removeClass('active')
            .find('.mini-tlb').remove();
    };

    /**
     * The question state for the graphicGapMatch interaction
     * @extends taoQtiItem/qtiCreator/widgets/interactions/blockInteraction/states/Question
     * @exports taoQtiItem/qtiCreator/widgets/interactions/graphicGapMatchInteraction/states/Question
     */
    var GraphicGapMatchInteractionStateQuestion = stateFactory.extend(Question, initQuestionState, exitQuestionState);

    /**
     * Initialize the form linked to the interaction
     */
    GraphicGapMatchInteractionStateQuestion.prototype.initForm = function () {

        var widget = this.widget;
        var options = widget.options;
        var interaction = widget.element;
        var $form = widget.$form;
        var $container = widget.$original;
        var isResponsive = $container.hasClass('responsive');


        $form.html(formTpl({
            baseUrl: options.baseUrl,
            data: interaction.object.attr('data'),
            width: interaction.object.attr('width'),
            height: interaction.object.attr('height'),
            type: interaction.object.attr('type')
        }));

        imageSelector($form, options);

        formElement.initWidget($form);
        // this loads the main picture


        //Toggle the image resizing panel depending on the widget container is responsive or not.
        $form.find('.panel-interaction-size').toggle(!isResponsive);

        //init data change callbacks
        var callbacks = {};
        callbacks.data = function (interaction, value) {
            interaction.object.attr('data', value);
            widget.rebuild({
                ready: function (widget) {
                    widget.changeState('question');
                }
            });
        };
        callbacks.width = function (interaction, value) {
            interaction.object.attr('width', value);
        };
        callbacks.height = function (interaction, value) {
            interaction.object.attr('height', value);
        };
        callbacks.type = function (interaction, value) {
            if (!value || value === '') {
                interaction.object.removeAttr('type');
            }
            else {
                interaction.object.attr('type', value);
            }
        };
        formElement.setChangeCallbacks($form, interaction, callbacks, { validateOnInit: false });
    };

    return GraphicGapMatchInteractionStateQuestion;
});
