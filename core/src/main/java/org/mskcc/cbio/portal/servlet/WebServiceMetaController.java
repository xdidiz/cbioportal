/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package org.mskcc.cbio.portal.servlet;

import java.util.ArrayList;
import java.util.List;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.mskcc.cbio.portal.dao.DaoCancerStudy;
import org.mskcc.cbio.portal.dao.DaoException;
import org.mskcc.cbio.portal.dao.DaoTypeOfCancer;
import org.mskcc.cbio.portal.model.CancerStudy;
import org.mskcc.cbio.portal.model.TypeOfCancer;

/**
 *
 * @author abeshoua
 */
public class WebServiceMetaController {
    private enum ProteinArrayType {
        ANY, PROTEIN_LEVEL, PHOSPHORYLATION
    }
    public static JSONArray cancerTypes() throws DaoException {
        ArrayList<TypeOfCancer> typeOfCancerList = DaoTypeOfCancer.getAllTypesOfCancer();
        JSONArray ret = new JSONArray();
        for (int i=0; i<typeOfCancerList.size(); i++) {
            ret.add(typeOfCancerList.get(i).toJSONObject());
        }
        return ret;
    }
    
    public static JSONArray cancerStudies() {
        ArrayList<CancerStudy> cancerStudyList = DaoCancerStudy.getAllCancerStudies();
        JSONArray ret = new JSONArray();
        for(int i=0; i<cancerStudyList.size(); i++) {
            ret.add(cancerStudyList.get(i).toJSONObject());
        }
        return ret;
    }
    
    public static JSONObject cancerStudies(String study_id) {
        CancerStudy study = DaoCancerStudy.getCancerStudyByStableId(study_id);
        return study.toJSONObject();
    }
    
    public static JSONArray geneticProfiles(String study_id) {
        return null;
    }
    
    public static JSONArray clinicalAttributes(String case_set_id) {
        // Pass in a case set id
        return null;
    }
    public static JSONArray clinicalAttributes(List<String> case_ids) {
        // Pass in a list of case ids
        return null;
    }
    
    public static JSONArray proteinArray(String study_id, List<String> genes, ProteinArrayType protein_array_type) {
        return null;
    }
}
