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
define([
    'ui/feedback'
], function(feedback) {
    'use strict';
    
    function Form() {
        
    }
    
    Form.prototype.initEvents = function initEvents($container) {
        var that = this,
            aeInfo = this.accessElementInfo;
        
        $container.on('change', 'input', function(){
            var $input = $(this),
                name = $input.attr('name'),
                value = $input.val();
                
            aeInfo.setAttribute(name, value);
        });
        
        $container.on('click', '.delete', function(){
            var ae = aeInfo.getAssociatedAccessElement();
            
            aeInfo.remove();
            if (ae.getAccessElementInfo() === null) {
                ae.remove();
            }
            feedback().info('Access element removed.');
            $container.trigger('destroy');
        });
    };
    
    return Form;
});