/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.mskcc.cbio.portal.servlet;

import java.util.List;
import org.json.simple.JSONObject;

/**
 *
 * @author abeshoua
 */
public class WebServiceDataController {
    private enum ArrayInfo {
        NONE, ANTIBODY
    }
    public static JSONObject geneticProfiles(String profile_id, List<String> genes, String case_set_id) {
        return null;
    }
    public static JSONObject geneticProfiles(String profile_id, List<String> genes, List<String> case_ids) {
        return null;
    }
    
    public static JSONObject mutations(String profile_id, List<String> genes, String case_set_id) {
        return null;
    }
    public static JSONObject mutations(String profile_id, List<String> genes, List<String> case_ids) {
        return null;
    }
    
    public static JSONObject clinicalData(String case_set_id) {
        return null;
    }
    public static JSONObject clinicalData(List<String> case_ids) {
        return null;
    }
    
    public static JSONObject proteinArray(String case_set_id, ArrayInfo array_info) {
        return null;
    }
    public static JSONObject proteinArray(List<String> case_ids, ArrayInfo array_info) {
        return null;
    }
}
