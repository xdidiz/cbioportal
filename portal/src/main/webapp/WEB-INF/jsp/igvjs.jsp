<%@ page import="java.util.List" %>
<%@ page import="java.util.ArrayList" %>
<%@ page import="java.net.URLEncoder" %>
<%@ page import="com.google.common.base.Joiner" %>
<%@ page import="java.io.UnsupportedEncodingException" %>
<%@ page import="org.mskcc.cbio.portal.model.GeneWithScore" %>
<%@ page import="org.mskcc.cbio.portal.servlet.QueryBuilder" %>
<%@ page import="org.mskcc.cbio.portal.util.IGVLinking" %>
<%@ page import="org.mskcc.cbio.portal.dao.DaoGeneOptimized" %>
<%@ page import="org.mskcc.cbio.portal.model.CanonicalGene" %>
<%
      // construct gene list parameter to IGV
      // use geneWithScoreList so we don't get any OQL
      List<String> onlyGenesList = new ArrayList<String>();
      for (GeneWithScore geneWithScore : geneWithScoreList) {
          CanonicalGene gene = DaoGeneOptimized.getInstance().getGene(geneWithScore.getGene());
           
          if (gene!=null && !gene.isMicroRNA() && !gene.isPhosphoProtein()) {
              onlyGenesList.add(geneWithScore.getGene());
          }
      }
      String encodedGeneList = "";
      if (onlyGenesList.size() > 0) {
          try {
              encodedGeneList = URLEncoder.encode(Joiner.on(' ').join(onlyGenesList), "UTF-8");
          }
          catch(UnsupportedEncodingException e) {
          }
      }
%>

<link href="//maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css" rel="stylesheet">
<link href="//www.broadinstitute.org/igv/projects/igv-web/css/igv.css" type="text/css" rel="stylesheet">
<script type="text/javascript" src="//www.broadinstitute.org/igv/projects/igv-web/dist/igv-all.min.js"></script>

<div class="section" id="igv_tab">
    <% String[] segViewingArgs = IGVLinking.getIGVArgsForSegViewing(cancerTypeId, encodedGeneList); %>
                <div id="igv_container">
                    <script type="text/javascript">
                        var genome = "<%= segViewingArgs[2] %>";
                        var locus = "<%= segViewingArgs[1] %>";
                        locus = "brca1"; // TODO
                        var trackUrl = "ov_tcga_pub_data_cna_hg19.seg"//"<%= segViewingArgs[0] %>";
                        var trackLabel = "<%= segViewingArgs[3] %>"; // filename
                        var igv_options = {
                            genome: genome,
                            showNavigation: true,
                            locus: locus,
                            tracks: [{
                                        url: trackUrl,
                                        label: trackLabel,
                                        sampleHeight: 9,
                                        type: "seg",
                                        order:10000
                                }],
                            posColorScale: true,
                            negColorScale: true,
                        };
                        var launchIGV = function() {
                            var div = $("#igv_container");
                            igv.createBrowser(div[0], igv_options);
                            div.attr('data-loaded','true');
                        }
                        $("a[href='#igv_tab']").click(function() {
                            if (!$("#igv_container").attr('data-loaded')) {
                                launchIGV();
                            }
                        });
                        //igv.browser.search(locus);
    
                    </script>
                </div>
    <table>
        <tr>
            <td style="padding-right:25px; vertical-align:top;"><img src="images/IGVlogo.png" alt=""/></td>
            <td style="vertical-align:top">

                
                <br>
                    
                    <!--<a id="igvLaunch" href="#" onclick="prepIGVLaunch('<%= segViewingArgs[0] %>','<%= segViewingArgs[1] %>','<%= segViewingArgs[2] %>','<%= segViewingArgs[3] %>')"><img src="images/webstart.jpg" alt=""/></a>-->
                    <a id="igvLaunch" href="#" onclick="launchIGV();"><img src="images/webstart.jpg" alt=""/></a>
                <br>
                <p>
                    IGV is developed at the <a href="http://www.broadinstitute.org/">Broad Institute of MIT and Harvard</a>.
                </p>
            </td>
        </tr>
    </table>
</div>

