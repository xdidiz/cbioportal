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
import org.mskcc.cbio.portal.dao.DaoCaseList;
import org.mskcc.cbio.portal.dao.DaoClinicalAttribute;
import org.mskcc.cbio.portal.dao.DaoClinicalData;
import org.mskcc.cbio.portal.dao.DaoException;
import org.mskcc.cbio.portal.dao.DaoGeneticProfile;
import org.mskcc.cbio.portal.dao.DaoTypeOfCancer;
import org.mskcc.cbio.portal.model.CancerStudy;
import org.mskcc.cbio.portal.model.CaseList;
import org.mskcc.cbio.portal.model.ClinicalAttribute;
import org.mskcc.cbio.portal.model.ClinicalData;
import org.mskcc.cbio.portal.model.GeneticProfile;
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
        for (TypeOfCancer t: typeOfCancerList) {
            ret.add(t.toJSONObject());
        }
        return ret;
    }
    
    public static JSONArray cancerStudies() {
        ArrayList<CancerStudy> cancerStudyList = DaoCancerStudy.getAllCancerStudies();
        JSONArray ret = new JSONArray();
        for(CancerStudy cs: cancerStudyList) {
            ret.add(cs.toJSONObject());
        }
        return ret;
    }
    
    public static JSONObject cancerStudies(String study_id) {
        CancerStudy study = DaoCancerStudy.getCancerStudyByStableId(study_id);
        return study.toJSONObject();
    }
    
    public static JSONArray geneticProfiles(String study_id) {
        CancerStudy cancerStudy = DaoCancerStudy.getCancerStudyByStableId(study_id);
        ArrayList<GeneticProfile> profileList = DaoGeneticProfile.getAllGeneticProfiles(cancerStudy.getInternalId());
        JSONArray ret = new JSONArray();
        for (GeneticProfile p: profileList) {
            ret.add(p.toJSONObject());
        }
        return ret;
    }
    
    public static JSONArray caseLists(String study_id) throws DaoException {
        CancerStudy cancerStudy = DaoCancerStudy.getCancerStudyByStableId(study_id);
        ArrayList<CaseList> clList = (new DaoCaseList()).getAllCaseLists(cancerStudy.getInternalId());
        JSONArray ret = new JSONArray();
        for (CaseList cl: clList) {
            ret.add(cl.toJSONObject());
        }
        return ret;
    }
    public static JSONArray clinicalAttributes(String case_set_id) throws DaoException {
        DaoCaseList daoCaseList = new DaoCaseList();
        ArrayList<String> case_ids = daoCaseList.getCaseListByStableId(case_set_id).getCaseList();
        return WebServiceMetaController.clinicalAttributes(case_ids);
    }
    public static JSONArray clinicalAttributes(List<String> case_ids) {
        JSONArray ret = new JSONArray();
        List<String> attrIds = new ArrayList<String>();
        for (ClinicalData c: DaoClinicalData.getDataByCaseId(ca)) {
            attrIds.add(c.getAttrId());
        }
        for(ClinicalAttribute attr: DaoClinicalAttribute.getDatum(attrIds)) {
            ret.add(attr.toJSONObject());
        }
        return ret;
    }

}
