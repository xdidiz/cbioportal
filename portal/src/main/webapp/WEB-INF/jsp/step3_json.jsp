<%--
 - Copyright (c) 2015 Memorial Sloan-Kettering Cancer Center.
 -
 - This library is distributed in the hope that it will be useful, but WITHOUT
 - ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS
 - FOR A PARTICULAR PURPOSE. The software and documentation provided hereunder
 - is on an "as is" basis, and Memorial Sloan-Kettering Cancer Center has no
 - obligations to provide maintenance, support, updates, enhancements or
 - modifications. In no event shall Memorial Sloan-Kettering Cancer Center be
 - liable to any party for direct, indirect, special, incidental or
 - consequential damages, including lost profits, arising out of the use of this
 - software and its documentation, even if Memorial Sloan-Kettering Cancer
 - Center has been advised of the possibility of such damage.
 --%>

<%--
 - This file is part of cBioPortal.
 -
 - cBioPortal is free software: you can redistribute it and/or modify
 - it under the terms of the GNU Affero General Public License as
 - published by the Free Software Foundation, either version 3 of the
 - License.
 -
 - This program is distributed in the hope that it will be useful,
 - but WITHOUT ANY WARRANTY; without even the implied warranty of
 - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 - GNU Affero General Public License for more details.
 -
 - You should have received a copy of the GNU Affero General Public License
 - along with this program.  If not, see <http://www.gnu.org/licenses/>.
--%>

<%@ page import="org.mskcc.cbio.portal.servlet.QueryBuilder" %>
<%
    String step3ErrorMsg = (String) request.getAttribute(QueryBuilder.STEP3_ERROR_MSG);
%>

<div class="query_step_section" id="step3">
	<table>
		<tr>
			<td width="23%">
    		    <span class="step_header">Select Patient/Case Set:</span>
			</td>
			<td>
				<select id="select_case_set" name="<%= QueryBuilder.CASE_SET_ID %>" title="Select Patient/Case Set"></select>
	 		</td>
	 		<td>
                <!--
	 			<a id="build_custom_case_set" onclick="promptCustomCaseSetBuilder()" title="Build a Custom Case Set Based on Clinical Attributes">
	 				Build Case Set
	 			</a>
	 			-->
	 		</td>
		</tr>
        <tr>
            <td></td>
            <td>
                <div>
                    <!-- add new link for the new functionality which links to the study view -->
                    <a id="build_case_set" onclick="openStudyView()" title="Build a Case Set via Study View">
                        <%= GlobalProperties.getStudyviewLinkText()%>
                    </a>
                </div>
            </td>
            <td></td>
        </tr>
	</table>
	
	<div id="custom_case_set_dialog" title="Build a Case Set">
		<table id="case_set_dialog_header">
			<tr>
				<td id="selected_cancer_study_title" align="left">Build a Custom Case Set for: </td>
				<td id="number_of_cases_title" align="right">Number of Matching Cases: </td>
			</tr>
			<tr>
				<td id="selected_cancer_study" align="left"></td>
				<td id="number_of_cases" align="right"></td>
			</tr>
			<tr>
				<td>&nbsp;</td>
				<td class="custom_case_set_warning" align="right"></td>
			</tr>
		</table>
		<table id="case_set_dialog_content"></table>
		<table id="case_set_dialog_footer">			
   			<tr>
   				<td>
					<button id="cancel_custom_case_set" title="Cancel">Cancel</button>
				</td>
				<td>
					<button id="submit_custom_case_set" class="tabs-button" title="Use this case set">Build</button>
				</td>
			</tr>
		</table>
	</div>
	<%
	String customCaseListStyle = "none";
	// Output step 3 form validation error
	if (step3ErrorMsg != null) {
	    out.println("<div class='ui-state-error ui-corner-all' style='margin-top:4px; padding:5px;'>"
	            + "<span class='ui-icon ui-icon-alert' style='float: left; margin-right: .3em;'></span>"
	            + "<strong>" + step3ErrorMsg + "</strong>");
	    customCaseListStyle = "block";
	}
	%>
    <div id='custom_case_list_section' style="display:<%= customCaseListStyle %>;">
        <p><span style="font-size:80%">Enter case IDs below:</span></p>
<textarea id='custom_case_set_ids' name='<%= QueryBuilder.CASE_IDS %>' rows=6 cols=80 title="Enter case IDs"></textarea>
<br/>
<input type="radio" name='patient_case_select' value="sample" title="Query by sample ID" checked>By sample ID</input>
<br/>
<input type="radio" name='patient_case_select' value="patient" title="Query by patient ID">By patient ID</input>
    </div>

<%
if (step3ErrorMsg != null) {
    out.println("</div>");
}
%>
</div>
