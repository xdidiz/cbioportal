/*
 * Copyright (c) 2015 Memorial Sloan-Kettering Cancer Center.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS
 * FOR A PARTICULAR PURPOSE. The software and documentation provided hereunder
 * is on an "as is" basis, and Memorial Sloan-Kettering Cancer Center has no
 * obligations to provide maintenance, support, updates, enhancements or
 * modifications. In no event shall Memorial Sloan-Kettering Cancer Center be
 * liable to any party for direct, indirect, special, incidental or
 * consequential damages, including lost profits, arising out of the use of this
 * software and its documentation, even if Memorial Sloan-Kettering Cancer
 * Center has been advised of the possibility of such damage.
 */

/*
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

package org.mskcc.cbio.portal.servlet;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.math3.stat.correlation.PearsonsCorrelation;
import org.apache.commons.math3.stat.correlation.SpearmansCorrelation;
import org.cbioportal.model.GeneticEntity.EntityType;
import org.cbioportal.persistence.MutationRepository;
import org.codehaus.jackson.JsonNode;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.node.ObjectNode;
import org.json.simple.JSONObject;
import org.json.simple.JSONValue;
import org.mskcc.cbio.portal.dao.DaoCancerStudy;
import org.mskcc.cbio.portal.dao.DaoException;
import org.mskcc.cbio.portal.dao.DaoGeneOptimized;
import org.mskcc.cbio.portal.dao.DaoGeneticProfile;
import org.mskcc.cbio.portal.model.CancerStudy;
import org.mskcc.cbio.portal.model.CanonicalGene;
import org.mskcc.cbio.portal.model.GeneticAlterationType;
import org.mskcc.cbio.portal.model.GeneticProfile;
import org.mskcc.cbio.portal.util.AccessControl;
import org.mskcc.cbio.portal.util.CoExpUtil;
import org.mskcc.cbio.portal.util.SpringUtil;
import org.mskcc.cbio.portal.util.XssRequestWrapper;

/**
 * Get the top co-expressed genes for queried genes
 *
 * @param : cancer study id
 * @param : queried genes
 * @return : JSON objects of co-expression under the same cancer_study
 * (but always the mrna genetic profile)
 */
public class GetCoExpressionJSON extends HttpServlet {

    private double coExpScoreThreshold = 0.3;
    //private int resultLength = 250;
    
    // class which process access control to cancer studies
    private AccessControl accessControl;
    
    /**
     * Initializes the servlet.
     */
    public void init() throws ServletException {
        super.init();
        accessControl = SpringUtil.getAccessControl();
    }

    /**
     * Handles HTTP GET Request.
     *
     * @param httpServletRequest  HttpServletRequest
     * @param httpServletResponse HttpServletResponse
     * @throws ServletException
     */
    protected void doGet(HttpServletRequest httpServletRequest,
                         HttpServletResponse httpServletResponse) throws ServletException, IOException {
        doPost(httpServletRequest, httpServletResponse);
    }

    /**
     * Handles the HTTP POST Request.
     *
     * @param httpServletRequest  HttpServletRequest
     * @param httpServletResponse HttpServletResponse
     * @throws ServletException
     */
    protected void doPost(HttpServletRequest httpServletRequest,
                          HttpServletResponse httpServletResponse) throws ServletException, IOException {

        String cancerStudyIdentifier = httpServletRequest.getParameter("cancer_study_id");
        CancerStudy cancerStudy = null;
        ArrayList<JsonNode> fullResultJson = new ArrayList<JsonNode>();
        ObjectMapper mapper = new ObjectMapper();
        httpServletResponse.setContentType("application/json");
        PrintWriter out = httpServletResponse.getWriter();
        try{
        	if(cancerStudyIdentifier != null) {
        		cancerStudy = DaoCancerStudy.getCancerStudyByStableId(cancerStudyIdentifier);
                if (cancerStudy == null || accessControl.isAccessibleCancerStudy(cancerStudy.getCancerStudyStableId()).size() == 0) {
                	 mapper.writeValue(out, fullResultJson);
                	 return;
                }
        	} else {
        		mapper.writeValue(out, fullResultJson);
           	 return;
        	}
        } catch (DaoException e) {
            System.out.println(e.getMessage());
            return;
        }
        
        String queryGeneticEntity = httpServletRequest.getParameter("genetic_entity");
        //TODO : is this needed?
        if (httpServletRequest instanceof XssRequestWrapper) {
        	queryGeneticEntity = ((XssRequestWrapper) httpServletRequest).getRawParameter("genetic_entity");
        }
        String queryGeneticEntityType = httpServletRequest.getParameter("genetic_entity_type");
        String profileId = httpServletRequest.getParameter("profile_id");//always an expression profile, never a gsva-scores one
        String correlated_entities_to_find = httpServletRequest.getParameter("correlated_entities_to_find");
        String caseSetId = httpServletRequest.getParameter("case_set_id");
        String caseIdsKey = httpServletRequest.getParameter("case_ids_key");
        boolean isFullResult = Boolean.parseBoolean(httpServletRequest.getParameter("is_full_result"));

        PearsonsCorrelation pearsonsCorrelation = new PearsonsCorrelation();
        SpearmansCorrelation spearmansCorrelation = new SpearmansCorrelation();
        DaoGeneOptimized daoGeneOptimized = DaoGeneOptimized.getInstance();
        
        int queryGeneticEntityId;
        if (EntityType.GENESET.name().equals(queryGeneticEntityType)) {
        	queryGeneticEntityId = CoExpUtil.getEntityIdForGeneset(queryGeneticEntity); //TODO use DaoGeneset (new one added by Angelica)
        } else if (EntityType.GENE.name().equals(queryGeneticEntityType)) {
        	queryGeneticEntityId = daoGeneOptimized.getGene(queryGeneticEntity).getGeneticEntityId();
        }
        else {
        	//raise error
        	throw new IllegalArgumentException("Not supported: " + queryGeneticEntityType);
        }        

        if (!isFullResult) {
        	//validation:
        	GeneticProfile subjectProfile;
            GeneticProfile queryProfile;
            //queryGeneticEntityType and correlated_entities_to_find are used to determine
            //the subjectProfile and queryProfile:
            if ((EntityType.GENE.name().equals(correlated_entities_to_find))) {
            	queryProfile = DaoGeneticProfile.getGeneticProfileByStableId(profileId);
            	if (EntityType.GENE.name().equals(queryGeneticEntityType)) {
            		subjectProfile = queryProfile;
            	} else {
            		subjectProfile = getReferringGenesetProfile(profileId);
            	}
            }
            else if ((EntityType.GENESET.name().equals(correlated_entities_to_find))) {
            	queryProfile = getReferringGenesetProfile(profileId);
            	if (EntityType.GENE.name().equals(queryGeneticEntityType)) {
            		subjectProfile = DaoGeneticProfile.getGeneticProfileByStableId(profileId);
            	} else {
            		subjectProfile = queryProfile;
            	}
            }
            else {
            	throw new IllegalArgumentException("The entity to find " + correlated_entities_to_find +" is not supported");
            }
            	
            if (queryProfile != null) {
                try {
                    Map<Integer, double[]> map = CoExpUtil.getExpressionMap(queryProfile.getGeneticProfileId(), caseSetId, caseIdsKey);
                    int mapSize = map.size();
                    List<Integer> genetic_entities = new ArrayList<Integer>(map.keySet());
                    //expression of the query item. All other expression lists in the map are compared to this: 
                    double[] subject_gene_entity_exp = CoExpUtil.getExpressionList(subjectProfile.getGeneticProfileId(), caseSetId, caseIdsKey, queryGeneticEntityId);
                    //iterate over all the other items, comparing to the query_gene_entity_exp:
                    for (int i = 0; i < mapSize; i++) {
                        Integer compared_gene_entity_id = genetic_entities.get(i);
                        double[] compared_gene_entity_exp = map.get(compared_gene_entity_id);
                        if (compared_gene_entity_exp != null && subject_gene_entity_exp != null) {
                            //Filter out cases with empty value on either side
                            int min_length = subject_gene_entity_exp.length < compared_gene_entity_exp.length ? subject_gene_entity_exp.length : compared_gene_entity_exp.length;
                            ArrayList<Double> subject_gene_entity_exp_arrlist = new ArrayList<Double>();
                            ArrayList<Double> new_compared_gene_entity_exp_arrlist = new ArrayList<Double>();
                            for (int k = 0; k < min_length; k++) {
                                if (!Double.isNaN(subject_gene_entity_exp[k]) && !Double.isNaN(compared_gene_entity_exp[k])) {
                                    subject_gene_entity_exp_arrlist.add(subject_gene_entity_exp[k]);
                                    new_compared_gene_entity_exp_arrlist.add(compared_gene_entity_exp[k]);
                                }
                            }
                            Double[] _subject_query_gene_entity_exp = subject_gene_entity_exp_arrlist.toArray(new Double[0]);
                            Double[] _new_compared_gene_entity_exp = new_compared_gene_entity_exp_arrlist.toArray(new Double[0]);
                            //convert double object to primitive data
                            double[] subject_query_gene_entity_exp = new double[_subject_query_gene_entity_exp.length];
                            double[] new_compared_gene_entity_exp = new double[_new_compared_gene_entity_exp.length];
                            for (int m = 0; m < _subject_query_gene_entity_exp.length; m++) {
                                subject_query_gene_entity_exp[m] = _subject_query_gene_entity_exp[m].doubleValue();
                                new_compared_gene_entity_exp[m] = _new_compared_gene_entity_exp[m].doubleValue();
                            }
                                                        
                            if (subject_query_gene_entity_exp.length != 0 && new_compared_gene_entity_exp.length != 0) {
                                double pearson = pearsonsCorrelation.correlation(subject_query_gene_entity_exp, new_compared_gene_entity_exp);
                                if ((pearson >= coExpScoreThreshold ||
                                    pearson <= (-1) * coExpScoreThreshold) &&
                                    (compared_gene_entity_id != queryGeneticEntityId)) {
                                    //Only calculate spearman with high scored pearson gene pairs.
                                    double spearman = spearmansCorrelation.correlation(subject_query_gene_entity_exp, new_compared_gene_entity_exp);
                                    if ((spearman >= coExpScoreThreshold || spearman <= (-1) * coExpScoreThreshold) &&
                                        ((spearman > 0 && pearson > 0) || (spearman < 0 && pearson < 0))) {
                                    	//!! here another gene/geneset switch is needed to query either DaoGeneOptimized or CoExpUtil(temp method) for gene or geneset name
                                        //if ()
                                        ObjectNode _scores = mapper.createObjectNode();

                                    	if ((EntityType.GENE.name().equals(correlated_entities_to_find))) {
                                        	CanonicalGene comparedGene = daoGeneOptimized.getGeneByEntityId(compared_gene_entity_id);
                                            _scores.put("gene", comparedGene.getHugoGeneSymbolAllCaps());
                                        }
                                        else if ((EntityType.GENESET.name().equals(correlated_entities_to_find))) {
                                        	String entityStableId = CoExpUtil.getEntityStableIdForGenesetEntityId(compared_gene_entity_id);
                                            _scores.put("gene", entityStableId);//TODO change "gene" to a more generic name                                        	
                                        }
                                        _scores.put("profileId", queryProfile.getStableId());
                                        _scores.put("pearson", pearson);
                                        _scores.put("spearman", spearman);
                                        fullResultJson.add(_scores);
                                    }
                                }
                            } 
                        }
                    } 
                    mapper.writeValue(out, fullResultJson);
                } catch (DaoException e) {
                    System.out.println(e.getMessage());
                    mapper.writeValue(out, new JSONObject());
                }
            } else {
            	 mapper.writeValue(out, new JSONObject());
            }
        } else {
            StringBuilder fullResutlStr = new StringBuilder();
            fullResutlStr.append("Gene Symbol\tPearson Score\tSpearman Score\n");
            GeneticProfile final_gp = DaoGeneticProfile.getGeneticProfileByStableId(profileId);
            if (final_gp != null) {
                try {
                    Map<Integer, double[]> map = CoExpUtil.getExpressionMap(final_gp.getGeneticProfileId(), caseSetId, caseIdsKey);
                    int mapSize = map.size();
                    List<Integer> gene_entities = new ArrayList<Integer>(map.keySet());
                    //expression of the query item. All other expression lists in the map are compared to this: 
                    double[] query_gene_entity_exp = CoExpUtil.getExpressionList(final_gp.getGeneticProfileId(), caseSetId, caseIdsKey, queryGeneticEntityId);

                    for (int i = 0; i < mapSize; i++) {
                        Integer compared_gene_entity_id = gene_entities.get(i);
                        double[] compared_gene_entity_exp = map.get(compared_gene_entity_id);
                        if (compared_gene_entity_exp != null && query_gene_entity_exp != null) {
                            //Filter out cases with empty value on either side
                            int min_length = (query_gene_entity_exp.length < compared_gene_entity_exp.length) ? query_gene_entity_exp.length : compared_gene_entity_exp.length;
                            ArrayList<Double> new_query_gene_entity_exp_arrlist = new ArrayList<Double>();
                            ArrayList<Double> new_compared_gene_entity_exp_arrlist = new ArrayList<Double>();
                            for (int k = 0; k < min_length; k++) {
                                if (!Double.isNaN(query_gene_entity_exp[k]) && !Double.isNaN(compared_gene_entity_exp[k])) {
                                    new_query_gene_entity_exp_arrlist.add(query_gene_entity_exp[k]);
                                    new_compared_gene_entity_exp_arrlist.add(compared_gene_entity_exp[k]);
                                }
                            }
                            Double[] _new_query_gene_entity_exp = new_query_gene_entity_exp_arrlist.toArray(new Double[0]);
                            Double[] _new_compared_gene_entity_exp = new_compared_gene_entity_exp_arrlist.toArray(new Double[0]);
                            //convert double object to primitive data
                            double[] new_query_gene_entity_exp = new double[_new_query_gene_entity_exp.length];
                            double[] new_compared_gene_entity_exp = new double[_new_compared_gene_entity_exp.length];
                            for (int m = 0; m < _new_query_gene_entity_exp.length; m++) {
                                new_query_gene_entity_exp[m] = _new_query_gene_entity_exp[m].doubleValue();
                                new_compared_gene_entity_exp[m] = _new_compared_gene_entity_exp[m].doubleValue();
                            }
                            if (new_query_gene_entity_exp.length != 0 && new_compared_gene_entity_exp.length != 0 &&
                                compared_gene_entity_id != queryGeneticEntityId) {
                                double pearson = pearsonsCorrelation.correlation(new_query_gene_entity_exp, new_compared_gene_entity_exp);
                                double spearman = spearmansCorrelation.correlation(new_query_gene_entity_exp, new_compared_gene_entity_exp);
                                CanonicalGene comparedGene = daoGeneOptimized.getGeneByEntityId(compared_gene_entity_id); //TODO - Change CanonicalGene
                                fullResutlStr.append(
                                    comparedGene.getHugoGeneSymbolAllCaps() + "\t" +
                                    (double) Math.round(pearson * 100) / 100 + "\t" +
                                    (double) Math.round(spearman * 100) / 100 + "\n"
                                );
                            }
                        }
                    }
                    //construct file name
                    String fileName = "coexpression_" + queryGeneticEntityId + "_" +
                        final_gp.getProfileName().replaceAll("\\s+", "_") + "_" +
                        cancerStudyIdentifier.replaceAll("\\s+", "_") + ".txt";

                    httpServletResponse.setContentType("text/html");
                    httpServletResponse.setContentType("application/force-download");
                    httpServletResponse.setHeader("content-disposition", "inline; filename='" + fileName + "'");
                    out = httpServletResponse.getWriter();
                    JSONValue.writeJSONString(fullResutlStr, out);
                } catch (DaoException e) {
                    System.out.println(e.getMessage());
                    JSONValue.writeJSONString(new JSONObject(), out);
                }
            } else {
                JSONValue.writeJSONString(new JSONObject(), out);
            }
        }

    }

	private GeneticProfile getReferringGenesetProfile(String profileId) {
		GeneticProfile geneticProfile = DaoGeneticProfile.getGeneticProfileByStableId(profileId);
    	List<GeneticProfile> list_of_profiles;
		try {
			list_of_profiles = DaoGeneticProfile.getGeneticProfilesForAlterationTypeAndReferringTo
					(GeneticAlterationType.GENESET_SCORE, geneticProfile);
		} catch (DaoException e) {
			// TODO Auto-generated catch block
			throw new RuntimeException(e.getMessage());
		}
		List<GeneticProfile> gsva_profiles = new ArrayList<GeneticProfile>();
    	for (GeneticProfile gp : list_of_profiles) {
    		if ((gp.getDatatype()).equals("GSVA-SCORE")) {
    			gsva_profiles.add(gp);
    		}
    	}
    	GeneticProfile queryProfile;
		if (gsva_profiles.size() == 1) {
    		queryProfile = gsva_profiles.get(0);
    	} else if (gsva_profiles.size() > 1) {
    		//Throw error: no GSVA data for this study
    		throw new IllegalArgumentException("Only one GSVA scores file per study supported.");
    	} else {
    		//no score profile, so return null 
    		queryProfile = null;
    	}
    	return queryProfile;
	}
}



