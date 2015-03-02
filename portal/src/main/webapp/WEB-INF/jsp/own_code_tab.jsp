<div class="section" id="own_code_tab">
    <button id="own_code_tab_toggle_btn">Toggle Input/Output</button>
    <div id="own_code_tab_input">
        <div>
            <b>HTML</b><br>
            <textarea id="own_code_tab_html" rows="10" cols="50"></textarea>
        </div>
        <div>
            <b>JS</b><br>
            <textarea id="own_code_tab_js" rows="10" cols="50"></textarea>
        </div>
        <div>
            <b>CSS</b><br>
            <textarea id="own_code_tab_css" rows="10" cols="50"></textarea>
        </div>
    </div>
    <div id="own_code_tab_output">
        OUTPUT
        <iframe id="own_code_tab_iframe" width="100%" height="500px">
        </iframe>
    </div>
</div>
<script type="text/javascript">
    $(document).ready(function() {
        var input_tab = true;
        
        var toggle_btn = $("#own_code_tab").find("#own_code_tab_toggle_btn");
        var html_input = $("#own_code_tab").find("#own_code_tab_html");
        var js_input = $("#own_code_tab").find("#own_code_tab_js");
        var css_input = $("#own_code_tab").find("#own_code_tab_css");
        var iframe = $("#own_code_tab").find("#own_code_tab_iframe");
        
        var input_div = $("#own_code_tab").find("#own_code_tab_input");
        var output_div = $("#own_code_tab").find("#own_code_tab_output");
             
        var executeCode = function() {
            var htmlCode = html_input.val(), jsCode = js_input.val(), 
                    cssCode = css_input.val();
            iframe.remove();
            iframe = $('<iframe id="own_code_tab_iframe" width="100%" height="500px"></iframe>').appendTo(output_div);
            iframe[0].srcdoc = htmlCode;
            
            $(iframe).load(function() {
                iframe[0].contentWindow.eval(jsCode);
                var cssTag = "\<style rel='text/css'\>"+cssCode+"\</style\>";
                iframe.contents().find('head').append(cssTag);
            });
            
        };
        
        output_div.hide();
        toggle_btn.click(function() {
            input_div.toggle();
            output_div.toggle();
            input_tab = input_div.css('display') !== 'none';
            if (!input_tab) {
                executeCode();
            }
        });
    });
</script>